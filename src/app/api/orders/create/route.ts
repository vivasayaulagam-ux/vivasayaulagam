import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail, sendAdminNotification } from '@/lib/email';
import User from '@/models/User';
import Product from '@/models/Product';
import CourierCharge from '@/models/CourierCharge';
import Setting from '@/models/Setting';
import { getCourierFee } from '@/lib/shipping';
import { generateOrderToken } from '@/lib/orderToken';


type CheckoutItem = {
  id?: string;
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
};

type ShippingAddress = {
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
};

type CreateOrderPayload = {
  items?: CheckoutItem[];
  totalAmount?: number;
  shippingAddress?: ShippingAddress;
  isCod?: boolean;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { items, totalAmount, shippingAddress, isCod, paymentMethod, saveAsDefault } = (await req.json()) as any;

    if (isCod === true || paymentMethod === 'COD') {
      return NextResponse.json({ error: 'Cash on Delivery is no longer supported. Please pay online to place your order.' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    if (
      !shippingAddress?.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.phone ||
      !shippingAddress.state
    ) {
      return NextResponse.json({ error: 'Incomplete shipping address: fullName, address, city, postalCode, phone, and state are required.' }, { status: 400 });
    }

    await dbConnect();

    let userId = "";
    let emailToUse = "";

    if (session && session.user) {
      const sessionUser = session.user as typeof session.user & { id?: string };
      userId = sessionUser.id || "";
      emailToUse = session.user.email || "";
      if (!userId && emailToUse) {
        const dbUser = await User.findOne({ email: emailToUse });
        if (dbUser) {
          userId = dbUser._id.toString();
        }
      }
    } else {
      // Guest Checkout
      emailToUse = shippingAddress.email || `guest_${shippingAddress.phone}@guest.vivasayaulagam.com`;

      // Check if user exists with this email
      let dbUser = await User.findOne({ email: emailToUse });
      if (!dbUser) {
        // Create guest profile
        dbUser = await User.create({
          name: shippingAddress.fullName || 'Guest User',
          email: emailToUse,
          phone: shippingAddress.phone || '',
          addresses: [{
            label: 'Shipping',
            line1: shippingAddress.address || '',
            line2: shippingAddress.city || ''
          }]
        });
      }
      userId = dbUser._id.toString();
    }

    if (!userId) {
      return NextResponse.json({ error: 'Failed to resolve user for checkout' }, { status: 400 });
    }

    // Save/update defaultAddress if logged-in customer (unconditionally update with latest confirmed address)
    if (session && session.user) {
      const dbUser = await User.findById(userId);
      if (dbUser) {
        dbUser.defaultAddress = {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          email: shippingAddress.email || dbUser.email || '',
          addressLine1: shippingAddress.address,
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          pincode: shippingAddress.postalCode,
          country: shippingAddress.country || 'India'
        };
        await dbUser.save();
      }
    }

    // Retrieve active product prices and info from the database
    let totalWeightKg = 0;
    const formattedItems = [];
    
    // Import Setting model dynamically if needed or query it
    const Setting = (await import('@/models/Setting')).default;

    const parseWeightToKg = (val: string, defaultWeight = 0, defaultUnit = 'kg'): number => {
      if (!val) {
        return defaultUnit === 'g' ? defaultWeight / 1000 : defaultWeight;
      }
      const match = val.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === 'g' || unit === 'ml') return amount / 1000;
        return amount;
      }
      return defaultUnit === 'g' ? defaultWeight / 1000 : defaultWeight;
    };

    const productIds = items.map((item: any) => String(item.id || item.productId || '').split('-')[0]);
    if (productIds.some((id: string) => !id)) {
      return NextResponse.json({ error: 'Missing product ID in order items' }, { status: 400 });
    }
    const orderProducts = await Product.find({ _id: { $in: [...new Set(productIds)] } })
      .select('title images price status variants trackInventory quantity weight weightUnit isPhysical')
      .lean();
    const productsById = new Map(orderProducts.map((product: any) => [String(product._id), product]));

    for (const item of items) {
      const pId = item.id || item.productId;
      if (!pId) {
        return NextResponse.json({ error: 'Missing product ID in order items' }, { status: 400 });
      }
      
      const [mongoId, ...variantParts] = pId.split('-');
      const variantValue = variantParts.join('-'); // e.g., '500g'

      const product: any = productsById.get(mongoId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.name || 'Unknown'}` }, { status: 404 });
      }
      
      if (product.status !== 'active') {
        return NextResponse.json({ error: `Product is not active: ${product.title}` }, { status: 400 });
      }
      
      const orderQty = Math.floor(Number(item.quantity));
      if (!Number.isFinite(orderQty) || orderQty < 1) {
        return NextResponse.json({ error: `Invalid quantity for product: ${product.title}` }, { status: 400 });
      }
      
      // Determine variant price and stock
      let itemPrice = product.price;
      let finalName = product.title;
      let itemWeight = product.weight || 0;
      let itemWeightUnit = product.weightUnit || 'kg';

      if (variantValue) {
        const variant = product.variants.find((v: any) => v.value === variantValue);
        if (variant) {
          itemPrice = typeof variant.price === 'number' ? variant.price : (product.price + (variant.additionalPrice || 0));
          if (product.trackInventory && typeof variant.stock === 'number' && variant.stock < orderQty) {
            return NextResponse.json({ error: `Insufficient stock for variant: ${product.title} (${variantValue})` }, { status: 400 });
          }
        }
        finalName = `${product.title} - ${variantValue}`;
        itemWeight = parseWeightToKg(variantValue, product.weight, product.weightUnit);
        itemWeightUnit = 'kg';
      } else {
        if (product.trackInventory && product.quantity < orderQty) {
          return NextResponse.json({ error: `Insufficient stock for product: ${product.title}` }, { status: 400 });
        }
        itemWeight = parseWeightToKg('', product.weight, product.weightUnit);
        itemWeightUnit = 'kg';
      }

      if (product.isPhysical && itemWeight <= 0) {
        return NextResponse.json({ error: `Weight is not set for product: ${product.title}. Please contact support.` }, { status: 400 });
      }

      totalWeightKg += itemWeight * orderQty;
      
      formattedItems.push({
        productId: product._id.toString(),
        name: finalName,
        price: itemPrice, // STRICTLY USE DB OR VARIANT PRICE
        quantity: orderQty,
        image: product.images?.[0] || item.image || "",
        weightKg: itemWeight,
      });
    }

    const computedSubtotal = formattedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate custom courier fee matching database rules
    const state = shippingAddress?.state?.trim() || '';
    const pincode = shippingAddress?.postalCode?.trim() || '';

    const activeRules = await CourierCharge.find({ status: 'active' }).lean();

    let matchingRule: any = null;

    // Exact pincode match
    if (pincode) {
      matchingRule = activeRules.find((r: any) => r.pincode && r.pincode.trim() === pincode);
    }

    // Pincode range match
    if (!matchingRule && pincode) {
      const pinNum = parseInt(pincode, 10);
      if (Number.isInteger(pinNum)) {
        matchingRule = activeRules.find((r: any) => 
          r.pincode_start !== undefined && 
          r.pincode_end !== undefined && 
          pinNum >= r.pincode_start && 
          pinNum <= r.pincode_end
        );
      }
    }

    // State match
    if (!matchingRule && state) {
      matchingRule = activeRules.find((r: any) => 
        (r.state_name && r.state_name.toLowerCase() === state.toLowerCase()) ||
        (r.state_code && r.state_code.toLowerCase() === state.toLowerCase())
      );
    }

    let deliveryFee = 0;
    let appliedRate = 0;

    if (matchingRule && computedSubtotal >= (matchingRule.minimum_order_value || 0)) {
      appliedRate = matchingRule.courier_charge;
      if (matchingRule.free_shipping_above !== null && matchingRule.free_shipping_above !== undefined && computedSubtotal >= matchingRule.free_shipping_above) {
        deliveryFee = 0;
      } else {
        deliveryFee = Number((totalWeightKg * appliedRate).toFixed(2));
      }
    } else {
      const courierSetting = await Setting.findOne({ key: 'courier_charges' });
      const globalRates = courierSetting?.value || { rate_per_kg: 100 };
      appliedRate = globalRates.rate_per_kg ?? 100;
      deliveryFee = Number((totalWeightKg * appliedRate).toFixed(2));
    }

    if (deliveryFee <= 0 && totalWeightKg > 0) {
      const isFreeShipping = matchingRule && 
        matchingRule.free_shipping_above !== null && 
        matchingRule.free_shipping_above !== undefined && 
        computedSubtotal >= matchingRule.free_shipping_above;
      
      if (!isFreeShipping && appliedRate <= 0) {
        return NextResponse.json({ error: 'Courier rate is missing for your shipping location. Please contact support.' }, { status: 400 });
      }
    }

    const computedTotal = computedSubtotal + deliveryFee;

    // Validate client totalAmount against calculated server subtotal
    if (typeof totalAmount === 'number' && Number.isFinite(totalAmount)) {
      if (Math.abs(computedTotal - totalAmount) > 1) {
        return NextResponse.json({ error: 'Product prices have changed. Please refresh your cart and try again.' }, { status: 400 });
      }
    }

    // Check if Razorpay keys are properly configured or placeholders
    let isRazorpayConfigured = 
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && 
      !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes("your_key_id") && 
      !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes("dummy");

    // Safety check: force simulation if using a live key in development environment to avoid accidental charges
    const isLiveKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_live_");
    const isDevMode = process.env.NODE_ENV !== 'production';
    if (isLiveKey && isDevMode && process.env.ALLOW_LIVE_IN_DEV !== 'true') {
      console.warn("⚠️ Live Razorpay key detected in development mode. Forcing simulated transaction for safety.");
      isRazorpayConfigured = false;
    }

    let razorpayOrderId = "";
    let razorpayAmount = Math.round(computedTotal * 100);

    if (!isRazorpayConfigured) {
      console.warn("⚠️ Razorpay is using placeholder keys. Simulating mock order for local test.");
      razorpayOrderId = `rzp_mock_${Date.now().toString().slice(-6)}`;
    } else {
      const options = {
        amount: razorpayAmount,
        currency: "INR",
        receipt: `receipt_order_${Date.now()}`
      };
      const razorpayOrder = await razorpay.orders.create(options);
      razorpayOrderId = razorpayOrder.id;
      razorpayAmount = typeof razorpayOrder.amount === 'string' ? parseInt(razorpayOrder.amount, 10) : razorpayOrder.amount;
    }

    // Use new+save to guarantee pre-save hook fires
    const newOrder = new Order({
      user: userId,
      items: formattedItems,
      subtotalAmount: computedSubtotal,
      deliveryFee,
      totalWeightKg,
      courierRate: appliedRate,
      totalAmount: computedTotal,
      shippingAddress,
      status: 'pending',
      razorpayOrderId,
      isPaid: false
    });
    await newOrder.save();

    return NextResponse.json({
      orderId: razorpayOrderId,
      viuOrderId: newOrder.orderId,
      amount: razorpayAmount,
      dbOrderId: newOrder._id,
      token: generateOrderToken(newOrder._id.toString()),
      isSimulated: !isRazorpayConfigured
    });

  } catch (error) {
    console.error('Error creating order:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: `Failed to create order: ${message}` 
    }, { status: 500 });
  }
}
