import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { normalizeComboWeightKg, parseWeightFromText, calculateCartShipping, getStateChargeKey, toWeightKg } from '@/lib/shipping';
import { parseVariantMeasurement } from '@/lib/productVariants';
import User from '@/models/User';
import Product from '@/models/Product';
import CourierCharge from '@/models/CourierCharge';
import { generateOrderToken } from '@/lib/orderToken';
import { paymentLogger } from '@/lib/logger';

type CheckoutItem = {
  id?: string;
  productId?: string;
  variantId?: string;
  variantName?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  weight?: number;
  unit?: string;
  sku?: string;
};

type ShippingAddress = {
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  state?: string;
  country?: string;
  email?: string;
  addressLine2?: string;
};

export async function POST(req: Request) {
  try {
    const session = process.env.NODE_ENV === 'test' ? null : await getServerSession(authOptions);
    const { items, totalAmount, shippingAddress, isCod, paymentMethod } = (await req.json()) as any;
    const isCodOrder = isCod === true || paymentMethod === 'COD';

    await dbConnect();

    // Check if COD is globally enabled
    if (isCodOrder) {
      const Setting = (await import('@/models/Setting')).default;
      const codSetting = await Setting.findOne({ key: 'cod_enabled' });
      const isCodEnabled = codSetting ? Number(codSetting.value) === 1 : false;

      if (!isCodEnabled) {
        return NextResponse.json({ error: 'Cash on Delivery is no longer supported. Please pay online to place your order.' }, { status: 400 });
      }
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

      let dbUser = await User.findOne({ email: emailToUse });
      if (!dbUser) {
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

    // Save/update defaultAddress if logged-in customer
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

    let totalWeightKg = 0;
    const formattedItems = [];
    
    const productIds = items.map((item: any) =>
      String(item.productId || item.id || '').split('-')[0]
    );
    if (productIds.some((id: string) => !id)) {
      return NextResponse.json({ error: 'Missing product ID in order items' }, { status: 400 });
    }
    const orderProducts = await Product.find({ _id: { $in: [...new Set(productIds)] } })
      .select('title images price compareAtPrice sellingPrice mrp base_price_1kg base_mrp_1kg status sku variants trackInventory continueSelling quantity product_type courier_charge comboWeight weight weightUnit unit state_courier_charges')
      .lean();
    const productsById = new Map(orderProducts.map((product: any) => [String(product._id), product]));

    for (const item of items) {
      const pId = item.productId || item.id;
      if (!pId) {
        return NextResponse.json({ error: 'Missing product ID in order items' }, { status: 400 });
      }
      
      const [fallbackMongoId, ...variantParts] = String(item.id || '').split('-');
      const mongoId = String(item.productId || fallbackMongoId);
      const legacyVariantValue = variantParts.join('-');
      const requestedVariantId = String(item.variantId || '');
      const requestedVariantName = String(item.variantName || legacyVariantValue || '');

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
      
      let itemPrice = Number(product.sellingPrice ?? product.price ?? 0);
      const finalName = product.title;
      let itemWeight = 0.25;
      let selectedWeight = 0;
      let selectedUnit = product.unit || product.weightUnit || 'kg';
      let selectedVariantId = '';
      let selectedVariantName = '';
      let selectedSku = product.sku || '';

      if (product.product_type === 'combo') {
        itemPrice = Number(product.sellingPrice || product.price || 0);
        itemWeight = normalizeComboWeightKg(
          product.comboWeight !== undefined ? product.comboWeight : product.weight,
          product.weightUnit || product.unit || 'kg'
        );
        selectedWeight = itemWeight;
        selectedUnit = 'kg';
      } else if (product.variants && product.variants.length > 0) {
        const variant = (requestedVariantId || requestedVariantName)
          ? product.variants.find((candidate: any) => {
              const candidateId = String(candidate._id || candidate.id || '');
              const candidateValue = String(candidate.value || '').trim().toLowerCase();
              const reqName = requestedVariantName.trim().toLowerCase();
              return (
                (requestedVariantId && candidateId === requestedVariantId) ||
                (requestedVariantName && candidate.value === requestedVariantName) ||
                (reqName && candidateValue === reqName)
              );
            }) || product.variants[0]
          : product.variants[0];

        itemPrice = Number(variant.sellingPrice || variant.price || product.sellingPrice || product.price || 0);

        if (
          product.trackInventory &&
          !product.continueSelling &&
          typeof variant.stock === 'number' &&
          variant.stock < orderQty
        ) {
          return NextResponse.json(
            { error: `Insufficient stock for variant: ${product.title} (${variant.value})` },
            { status: 400 }
          );
        }

        const parsedMeasurement = parseVariantMeasurement(
          variant.value,
          variant.unit || product.unit || product.weightUnit || 'g'
        );
        selectedVariantId = String(variant._id || variant.id || variant.value);
        selectedVariantName = variant.value;
        selectedWeight = parsedMeasurement.weight;
        selectedUnit = parsedMeasurement.unit;
        selectedSku = variant.sku || product.sku || '';
        itemWeight = parsedMeasurement.weightKg || parseWeightFromText(variant.value);
      } else {
        if (product.trackInventory && !product.continueSelling && product.quantity < orderQty) {
          return NextResponse.json({ error: `Insufficient stock for product: ${product.title}` }, { status: 400 });
        }
        itemPrice = Number(product.sellingPrice || product.price || 0);
        selectedWeight = Number(product.weight || 0);
        selectedUnit = product.weightUnit || product.unit || 'kg';
        itemWeight = toWeightKg(selectedWeight, selectedUnit, product.title);
      }

      totalWeightKg += itemWeight * orderQty;
      
      formattedItems.push({
        productId: product._id.toString(),
        variantId: selectedVariantId || undefined,
        variantName: selectedVariantName || undefined,
        name: finalName,
        price: itemPrice,
        quantity: orderQty,
        image: product.images?.[0] || item.image || "",
        weight: selectedWeight,
        unit: selectedUnit,
        weightKg: itemWeight,
        sku: selectedSku,
        isCombo: product.product_type === 'combo',
        comboWeight: product.product_type === 'combo' ? itemWeight : undefined,
        state_courier_charges: product.state_courier_charges,
        courier_charge: product.courier_charge,
        product_type: product.product_type,
        isFreeShipping: Boolean(product.isFreeShipping),
      });
    }

    const computedSubtotal = formattedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const state = shippingAddress?.state?.trim() || '';
    const pincode = shippingAddress?.postalCode?.trim() || '';
    if (!state) {
      return NextResponse.json({ error: 'Delivery address state is required to calculate shipping.' }, { status: 400 });
    }

    const activeRules = await CourierCharge.find({ status: 'active' }).lean();
    let matchingRule: any = null;

    if (pincode) {
      matchingRule = activeRules.find((r: any) => r.pincode && r.pincode.trim() === pincode);
    }

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

    if (!matchingRule && state) {
      matchingRule = activeRules.find((r: any) =>
        (r.state_name && r.state_name.toLowerCase() === state.toLowerCase()) ||
        (r.state_code && r.state_code.toLowerCase() === state.toLowerCase())
      );
    }

    const deliveryFee = calculateCartShipping(formattedItems, state, computedSubtotal, matchingRule);
    const appliedRate = 0;

    const stateKey = getStateChargeKey(state);
    const slabItems = formattedItems.filter(item => {
      if (item.isFreeShipping === true) return false;
      const stateCharge = item.state_courier_charges?.[stateKey];
      const productCourierRate = (typeof stateCharge === 'number' && stateCharge > 0)
        ? stateCharge
        : (item.courier_charge > 0 ? item.courier_charge : 0);
      return productCourierRate <= 0;
    });
    const totalWeightForSlabs = slabItems.reduce((sum, item) => sum + item.weightKg * item.quantity, 0);

    if (deliveryFee <= 0 && totalWeightForSlabs > 0) {
      const ruleApplies = matchingRule && computedSubtotal >= (matchingRule.minimum_order_value || 0);
      const isFreeShipping = ruleApplies &&
        matchingRule.free_shipping_above !== null &&
        matchingRule.free_shipping_above !== undefined &&
        computedSubtotal >= matchingRule.free_shipping_above;

      if (!isFreeShipping) {
        return NextResponse.json({ error: 'Courier rate is missing for your shipping location. Please contact support.' }, { status: 400 });
      }
    }

    const computedTotal = computedSubtotal + deliveryFee;

    const clientSubtotal = items.reduce(
      (sum: number, i: any) => sum + (Number(i.price) || 0) * (Math.floor(Number(i.quantity)) || 1),
      0
    );

    if (typeof totalAmount === 'number' && Number.isFinite(totalAmount)) {
      const subtotalDiff = Math.abs(computedSubtotal - clientSubtotal);
      const totalDiff = Math.abs(computedTotal - totalAmount);

      if (subtotalDiff > 1 && totalDiff > 1) {
        return NextResponse.json({ error: 'Product prices have changed. Please refresh your cart and try again.' }, { status: 400 });
      }
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const isPlaceholderKey = !keyId || keyId.includes("your_key_id") || keyId.includes("dummy");
    let isRazorpayConfigured = !isPlaceholderKey;

    let razorpayOrderId = "";
    let razorpayAmount = Math.round(computedTotal * 100);

    if (isCodOrder) {
      razorpayOrderId = `cod_${Date.now()}_${String(Math.random()).slice(-6)}`;
    } else {
      if (!isRazorpayConfigured) {
        paymentLogger.warn({
          event: 'RAZORPAY_ORDER_SIMULATED',
          amount: computedTotal,
          details: { reason: 'Razorpay keys are unconfigured or placeholders' }
        });
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

        paymentLogger.info({
          event: 'RAZORPAY_ORDER_CREATED',
          razorpayOrderId,
          amount: razorpayAmount,
          details: { currency: "INR", receipt: options.receipt }
        });
      }
    }

    const newOrder = new Order({
      user: userId,
      items: formattedItems,
      subtotalAmount: computedSubtotal,
      deliveryFee,
      totalWeightKg,
      courierRate: appliedRate,
      totalAmount: computedTotal,
      total_weight: totalWeightKg,
      courier_charge: deliveryFee,
      shipping_charge: deliveryFee,
      grand_total: computedTotal,
      shippingAddress,
      status: 'pending',
      razorpayOrderId,
      isPaid: false,
      paymentMethod: isCodOrder ? 'COD' : 'online'
    });
    await newOrder.save();

    paymentLogger.info({
      event: 'ORDER_SAVED_PENDING',
      orderId: newOrder._id.toString(),
      razorpayOrderId,
      amount: computedTotal,
      status: 'pending',
      details: { viuOrderId: newOrder.orderId, paymentMethod: isCodOrder ? 'COD' : 'online' }
    });

    if (isCodOrder) {
      let omsSuccess = false;
      try {
        const { syncOrderToOMS } = await import('@/lib/services/omsSync');
        omsSuccess = await syncOrderToOMS(newOrder);
      } catch (omsErr) {
        paymentLogger.error({
          event: 'COD_OMS_SYNC_FAILED',
          orderId: newOrder._id.toString(),
          error: omsErr
        });
      }

      if (!omsSuccess) {
        newOrder.status = 'pending';
        newOrder.sync_status = 'Failed';
        await newOrder.save();

        return NextResponse.json({
          error: newOrder.sync_error || 'Unable to create order in OMS. Please contact support or retry.',
          retryable: true
        }, { status: 502 });
      }

      newOrder.status = 'processing';
      newOrder.sync_status = 'Synced';
      await newOrder.save();

      try {
        const { deductOrderStock } = await import('@/lib/inventory');
        await deductOrderStock(formattedItems);
      } catch (stockErr) {
        paymentLogger.error({
          event: 'COD_STOCK_DEDUCTION_FAILED',
          orderId: newOrder._id.toString(),
          error: stockErr
        });
      }
    }

    return NextResponse.json({
      orderId: razorpayOrderId,
      viuOrderId: newOrder.orderId,
      amount: razorpayAmount,
      dbOrderId: newOrder._id,
      token: generateOrderToken(newOrder._id.toString()),
      isSimulated: !isCodOrder && !isRazorpayConfigured,
      isCod: isCodOrder
    });

  } catch (error) {
    paymentLogger.error({
      event: 'CREATE_ORDER_EXCEPTION',
      error
    });
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: `Failed to create order: ${message}` 
    }, { status: 500 });
  }
}
