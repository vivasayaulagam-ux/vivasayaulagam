import './loadEnv';
import dbConnect from '../src/lib/db';
import Setting from '../src/models/Setting';
import Order from '../src/models/Order';
import Product from '../src/models/Product';
import User from '../src/models/User';
import OmsSyncLog from '../src/models/OmsSyncLog';
(process.env as any).NODE_ENV = 'test';

import { POST as createOrderPOST } from '../src/app/api/orders/create/route';

async function runTests() {
  console.log('Connecting to database...');
  await dbConnect();
  console.log('Connected.');

  // Find or create test product & user
  let product = await Product.findOne({ sku: 'PROD-A' });
  if (!product) {
    product = await Product.create({
      title: 'Product A',
      price: 100,
      sku: 'PROD-A',
      quantity: 100,
      status: 'active',
      weight: 250,
      weightUnit: 'g',
    });
  }

  // Dynamically calculate shipping using the application's own shipping calculator route
  const shipRoute = await import('../src/app/api/shipping/calculate/route');
  const calculateShippingGET = shipRoute.GET;
  
  const itemWeightKg = product.weightUnit?.toLowerCase() === 'g' ? (product.weight / 1000) : (product.weight || 0);
  const queryParams = new URLSearchParams({
    state: 'Tamil Nadu',
    pincode: '600001',
    subtotal: String(product.price * 2),
    weight: String(itemWeightKg * 2),
    items: JSON.stringify([{ productId: product._id.toString(), quantity: 2, price: product.price, weightKg: itemWeightKg }])
  });

  const shipReq = new Request(`http://localhost/api/shipping/calculate?${queryParams.toString()}`);
  const shipRes = await calculateShippingGET(shipReq as any);
  const shipJson = await shipRes.json();
  
  const deliveryFee = shipJson.success ? shipJson.courier_charge : 0;
  const expectedTotal = (product.price * 2) + deliveryFee;

  const payload = {
    items: [{
      id: product._id.toString(),
      name: 'Product A - 250g',
      price: product.price,
      quantity: 2,
    }],
    totalAmount: expectedTotal,
    shippingAddress: {
      fullName: 'John Doe',
      address: '123 Test Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
      phone: '9876543210',
      email: 'testuser@example.com',
    },
    isCod: true,
    paymentMethod: 'COD',
  };

  // --- Test 1: COD is Disabled ---
  console.log('\n--- Test 1: Testing COD checkout when COD is Disabled ---');
  await Setting.findOneAndUpdate(
    { key: 'cod_enabled' },
    { value: 0 }, // 0 = Disabled
    { upsert: true }
  );
  console.log('Set cod_enabled = 0 in database settings.');

  let req = new Request('http://localhost/api/orders/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  let response = await createOrderPOST(req);
  let json = await response.json();
  console.log('Response Status:', response.status);
  console.log('Response Body:', JSON.stringify(json));

  if (response.status === 400 && json.error && json.error.includes('no longer supported')) {
    console.log('✓ Success: API correctly rejected COD order when disabled.');
  } else {
    console.error('✗ Failure: API failed to reject COD order when disabled.');
    process.exit(1);
  }

  // --- Test 2: COD is Enabled ---
  console.log('\n--- Test 2: Testing COD checkout when COD is Enabled ---');
  await Setting.findOneAndUpdate(
    { key: 'cod_enabled' },
    { value: 1 }, // 1 = Enabled
    { upsert: true }
  );
  console.log('Set cod_enabled = 1 in database settings.');

  req = new Request('http://localhost/api/orders/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  response = await createOrderPOST(req);
  json = await response.json();
  console.log('Response Status:', response.status);
  console.log('Response Body:', JSON.stringify(json));

  if (response.status === 200 && json.isCod === true && json.dbOrderId) {
    console.log('✓ Success: API accepted COD order and returned order details.');
  } else {
    console.error('✗ Failure: API failed to accept COD order when enabled.');
    process.exit(1);
  }

  // --- Test 3: Verify order fields and sync ---
  console.log('\n--- Test 3: Verifying order properties in database ---');
  const dbOrder = await Order.findById(json.dbOrderId);
  if (!dbOrder) {
    console.error('✗ Failure: Order not found in database.');
    process.exit(1);
  }

  console.log('Order paymentMethod:', dbOrder.paymentMethod);
  console.log('Order status:', dbOrder.status);
  console.log('Order sync_status:', dbOrder.sync_status);
  console.log('OMS Order ID:', dbOrder.oms_order_id);
  console.log('OMS Order Number:', dbOrder.oms_order_number);

  if (
    dbOrder.paymentMethod === 'COD' &&
    dbOrder.status === 'processing' &&
    dbOrder.sync_status === 'Synced' &&
    dbOrder.oms_order_number
  ) {
    console.log('✓ Success: Order is saved as COD/processing and successfully synced.');
  } else {
    console.error('✗ Failure: Database validation failed.');
    process.exit(1);
  }

  // --- Test 4: Verify sync logs for COD parameters ---
  console.log('\n--- Test 4: Checking OMS sync log payload values ---');
  const syncLog = await OmsSyncLog.findOne({ websiteOrderId: dbOrder.orderId }).sort({ createdAt: -1 });
  if (!syncLog) {
    console.error('✗ Failure: Sync log not found.');
    process.exit(1);
  }

  const requestPayload = JSON.parse(syncLog.request);
  console.log('Logged payment_method:', requestPayload.payment_method);
  console.log('Logged payment_status:', requestPayload.payment_status);
  console.log('Logged payment_reference:', requestPayload.payment_reference);

  if (
    requestPayload.payment_method === 'COD' &&
    requestPayload.payment_status === 'Pending' &&
    requestPayload.payment_reference === 'COD'
  ) {
    console.log('✓ Success: Sync payload has correct COD parameters.');
  } else {
    console.error('✗ Failure: Sync payload check failed.');
    process.exit(1);
  }

  console.log('\n=========================================');
  console.log('ALL COD TOGGLE INTEGRATION TESTS PASSED!');
  console.log('=========================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
