import './loadEnv';
import dbConnect from '../src/lib/db';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Category from '../src/models/Category';
import CourierCharge from '../src/models/CourierCharge';
import Order from '../src/models/Order';
import Setting from '../src/models/Setting';
import { DEFAULT_TN_SLABS } from '../src/lib/shipping';

const BASE_URL = 'http://localhost:3000';

async function runE2ETest() {
  console.log('\n==================================================');
  console.log('STARTING COD ORDER E2E AUDIT');
  console.log('==================================================');

  await dbConnect();

  // 1. Setup mock user and category
  const testUser = await User.findOne({ email: 'user@vivasayaulagam.com' });
  if (!testUser) {
    throw new Error('User not found. Run scripts/audit-apis.ts once to setup accounts.');
  }

  // Clear previous mock products if any
  await Product.deleteMany({ title: /E2E/ });

  let category = await Category.findOne({ name: 'Mock Category' });
  let createdCategory = false;
  if (!category) {
    category = await Category.create({
      name: 'Mock Category',
      slug: 'mock-category',
      status: 'active'
    });
    createdCategory = true;
    console.log('✓ Created transient Category for E2E test');
  }

  // 2. Create products with inventory tracking
  console.log('\n--- 1. Creating Mock Products with Stock = 10 ---');
  
  const elluProduct = await Product.create({
    title: 'E2E Ellu Urundai - 250g',
    price: 100,
    sku: 'E2E-ELLU-250G',
    quantity: 10,
    status: 'active',
    category: category._id,
    trackInventory: true,
    isPhysical: true
  });
  console.log(`✓ Created: ${elluProduct.title} (Stock: ${elluProduct.quantity}, Price: ₹${elluProduct.price})`);

  const kadalaiProduct = await Product.create({
    title: 'E2E Kadalai Urundai - 750g',
    price: 150,
    sku: 'E2E-KADALAI-750G',
    quantity: 10,
    status: 'active',
    category: category._id,
    trackInventory: true,
    isPhysical: true
  });
  console.log(`✓ Created: ${kadalaiProduct.title} (Stock: ${kadalaiProduct.quantity}, Price: ₹${kadalaiProduct.price})`);

  // 3. Ensure Tamil Nadu Courier Charge Rule exists with Slabs
  console.log('\n--- 2. Setting up Tamil Nadu Courier Slabs ---');
  await CourierCharge.deleteMany({ state_code: 'TN' });
  const tnCourierRule = await CourierCharge.create({
    state_name: 'Tamil Nadu',
    state_code: 'TN',
    courier_charge: 50,
    slabs: DEFAULT_TN_SLABS,
    minimum_order_value: 0,
    free_shipping_above: 5000, // Make high to prevent free shipping
    status: 'active'
  });
  console.log('✓ Configured Tamil Nadu slabs rule in database');

  // 4. Test Calculate Shipping API
  console.log('\n--- 3. Testing Shipping Calculation API ---');
  const calcRes = await fetch(`${BASE_URL}/api/shipping/calculate?state=Tamil%20Nadu&subtotal=250&weight=1.0`);
  const calcText = await calcRes.text();
  let calcData: any;
  try {
    calcData = JSON.parse(calcText);
  } catch (err) {
    console.error("Failed to parse shipping calculate response as JSON! Raw text response was:");
    console.error(calcText);
    throw err;
  }
  
  if (!calcRes.ok || !calcData.success) {
    throw new Error(`Calculate shipping failed: ${JSON.stringify(calcData)}`);
  }
  
  console.log(`✓ Shipping calculation output: Courier Charge = ₹${calcData.courier_charge}`);
  if (calcData.courier_charge !== 50) {
    throw new Error(`Shipping charge mismatch! Expected ₹50, got ₹${calcData.courier_charge}`);
  }

  // 5. Test Order Creation API
  console.log('\n--- 4. Creating COD Order via API ---');
  const orderPayload = {
    items: [
      { id: String(elluProduct._id), name: 'E2E Ellu Urundai - 250g', price: 100, quantity: 1 },
      { id: String(kadalaiProduct._id), name: 'E2E Kadalai Urundai - 750g', price: 150, quantity: 1 }
    ],
    totalAmount: 300, // Product total = 250, Shipping = 50. Total = 300.
    shippingAddress: {
      fullName: 'Mock E2E User',
      address: '123 E2E test street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
      phone: '9876543210',
      email: 'user@vivasayaulagam.com'
    },
    isCod: true,
    paymentMethod: 'COD'
  };

  // Run user registration next-auth session cookie generation
  const { encode } = await import('next-auth/jwt');
  const secret = process.env.NEXTAUTH_SECRET || 'my_super_secret_random_string_123_safe_secret';
  const token = { id: testUser._id.toString(), name: testUser.name, email: testUser.email, role: testUser.role };
  const encodedToken = await encode({ token, secret });
  const userCookie = `next-auth.session-token=${encodedToken}`;

  const orderRes = await fetch(`${BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': userCookie
    },
    body: JSON.stringify(orderPayload)
  });

  const orderData = await orderRes.json();
  if (!orderRes.ok || orderData.error) {
    throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`);
  }

  console.log('✓ Order created successfully. Order ID:', orderData.viuOrderId);

  // 6. Audit Database Order Fields
  console.log('\n--- 5. Auditing Saved Order in Database ---');
  const dbOrder = await Order.findById(orderData.dbOrderId);
  if (!dbOrder) {
    throw new Error('Order not found in database!');
  }

  let hasErrors = false;
  const asserts = [
    { name: 'total_weight', val: dbOrder.total_weight, expected: 1.0 },
    { name: 'courier_charge', val: dbOrder.courier_charge, expected: 50 },
    { name: 'shipping_charge', val: dbOrder.shipping_charge, expected: 50 },
    { name: 'grand_total', val: dbOrder.grand_total, expected: 300 },
    { name: 'deliveryFee', val: dbOrder.deliveryFee, expected: 50 },
    { name: 'totalAmount', val: dbOrder.totalAmount, expected: 300 },
    { name: 'status', val: dbOrder.status, expected: 'pending' },
    { name: 'isPaid', val: dbOrder.isPaid, expected: false },
    { name: 'paymentMethod', val: dbOrder.paymentMethod, expected: 'COD' }
  ];

  for (const assertion of asserts) {
    if (assertion.val !== assertion.expected) {
      console.error(`❌ Mismatch on order field "${assertion.name}": Expected ${assertion.expected}, got ${assertion.val}`);
      hasErrors = true;
    } else {
      console.log(`✓ Field "${assertion.name}" matches expected: ${assertion.val}`);
    }
  }

  // 7. Audit Product Inventory Stock
  console.log('\n--- 6. Auditing Stock Deductions ---');
  const updatedEllu = await Product.findById(elluProduct._id);
  const updatedKadalai = await Product.findById(kadalaiProduct._id);

  if (updatedEllu.quantity !== 9) {
    console.error(`❌ Ellu Urundai stock deduction error! Expected 9, got ${updatedEllu.quantity}`);
    hasErrors = true;
  } else {
    console.log('✓ Ellu Urundai stock correctly decremented to 9');
  }

  if (updatedKadalai.quantity !== 9) {
    console.error(`❌ Kadalai Urundai stock deduction error! Expected 9, got ${updatedKadalai.quantity}`);
    hasErrors = true;
  } else {
    console.log('✓ Kadalai Urundai stock correctly decremented to 9');
  }

  // 8. Audit OMS Sync Status
  console.log('\n--- 7. Auditing OMS Sync Status ---');
  console.log(`✓ Order OMS sync status: ${dbOrder.sync_status}`);
  if (dbOrder.sync_status !== 'Synced') {
    console.error(`❌ Expected OMS sync_status to be "Synced", got "${dbOrder.sync_status}"`);
    hasErrors = true;
  } else {
    console.log(`✓ OMS Synced successfully. OMS Order Ref: ${dbOrder.oms_order_id}`);
  }

  // 9. Clean up test products and order
  console.log('\n--- 8. Cleaning Up Mock Products and Orders ---');
  await Product.deleteMany({ _id: { $in: [elluProduct._id, kadalaiProduct._id] } });
  await Order.deleteOne({ _id: dbOrder._id });
  if (createdCategory) {
    await Category.deleteOne({ _id: category._id });
    console.log('✓ Transient Category cleaned up.');
  }
  console.log('✓ Database cleaned up successfully.');

  // Disconnect cleanly
  const mongoose = (await import('mongoose')).default;
  await mongoose.disconnect();

  if (hasErrors) {
    console.log('\n==================================================');
    console.log('❌ E2E AUDIT FAILED - MISMATCHES DETECTED');
    console.log('==================================================');
    process.exit(1);
  } else {
    console.log('\n==================================================');
    console.log('🎉 E2E AUDIT PASSED 100% SUCCESSFULLY');
    console.log('==================================================');
    process.exit(0);
  }
}

runE2ETest().catch((err) => {
  console.error('\nE2E Test Threw Error:', err);
  process.exit(1);
});
