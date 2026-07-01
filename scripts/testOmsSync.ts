import './loadEnv';
import dbConnect from '../src/lib/db';
import Order from '../src/models/Order';
import Product from '../src/models/Product';
import OmsSyncLog from '../src/models/OmsSyncLog';
import User from '../src/models/User';
import { syncOrderToOMS, syncPendingOrders } from '../src/lib/services/omsSync';

async function runTests() {
  console.log('Connecting to database...');
  await dbConnect();
  console.log('Connected.');

  // Find or create a test user
  let user = await User.findOne({ email: 'testuser@example.com' });
  if (!user) {
    user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      phone: '9876543210',
    });
  }

  // Find or create a test product with SKU PROD-A
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

  const uniqueSuffix = Date.now().toString().slice(-6);
  const testOrderId = `WEBTEST${uniqueSuffix}`;

  // 1. Create a dummy order in MongoDB (Paid but not synced)
  console.log('\n--- Test 1: Creating a test order in MongoDB ---');
  const order = await Order.create({
    orderId: testOrderId,
    user: user._id,
    items: [{
      productId: product._id.toString(),
      name: 'Product A - 250g',
      price: 100,
      quantity: 2,
      weightKg: 0.25,
    }],
    totalAmount: 200,
    subtotalAmount: 200,
    isPaid: true,
    paidAt: new Date(),
    status: 'processing',
    razorpayOrderId: `rzp_mock_${uniqueSuffix}`,
    razorpayPaymentId: `pay_mock_${uniqueSuffix}`,
    shippingAddress: {
      fullName: 'John Doe',
      address: '123 Test Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
      phone: '9876543210',
      email: 'testuser@example.com',
    },
    sync_status: 'Pending',
  });
  console.log(`Created order in MongoDB with orderId: ${order.orderId}`);

  // 2. Test successful sync to OMS
  console.log('\n--- Test 2: Syncing order to OMS ---');
  const syncResult1 = await syncOrderToOMS(order);
  console.log('Sync result:', syncResult1);

  // Reload order from DB
  let updatedOrder = await Order.findById(order._id);
  console.log('Updated order status in DB:', updatedOrder?.sync_status);
  console.log('OMS Order ID:', updatedOrder?.oms_order_id);
  console.log('OMS Order Number:', updatedOrder?.oms_order_number);

  if (syncResult1 && updatedOrder?.sync_status === 'Synced' && updatedOrder?.oms_order_number) {
    console.log('✓ Success: Sync completed successfully.');
  } else {
    console.error('✗ Failure: Sync failed.');
    process.exit(1);
  }

  // 3. Test duplicate protection (Never send twice)
  console.log('\n--- Test 3: Testing duplicate protection (Resending same order) ---');
  // Temporarily reset sync_status to Pending to simulate resending
  updatedOrder.sync_status = 'Pending';
  await updatedOrder.save();

  const syncResult2 = await syncOrderToOMS(updatedOrder);
  console.log('Resend Sync result:', syncResult2);

  const reloadedOrder = await Order.findById(order._id);
  console.log('Reloaded order status:', reloadedOrder?.sync_status);

  if (syncResult2 && reloadedOrder?.sync_status === 'Synced') {
    console.log('✓ Success: Duplicate detected and treated as success.');
  } else {
    console.error('✗ Failure: Duplicate protection failed.');
    process.exit(1);
  }

  // 4. Test offline error handling (pointing to a dead port)
  console.log('\n--- Test 4: Testing offline API handling ---');
  process.env.OMS_API_URL = 'http://localhost:9999/api/create-order.php'; // invalid port

  const offlineOrderId = `WEBOFFLINE${uniqueSuffix}`;
  const offlineOrder = await Order.create({
    orderId: offlineOrderId,
    user: user._id,
    items: [{
      productId: product._id.toString(),
      name: 'Product A - 250g',
      price: 100,
      quantity: 1,
      weightKg: 0.25,
    }],
    totalAmount: 100,
    subtotalAmount: 100,
    isPaid: true,
    paidAt: new Date(),
    status: 'processing',
    razorpayOrderId: `rzp_mock_offline_${uniqueSuffix}`,
    razorpayPaymentId: `pay_mock_offline_${uniqueSuffix}`,
    shippingAddress: {
      fullName: 'John Doe',
      address: '123 Test Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
      phone: '9876543210',
      email: 'testuser@example.com',
    },
    sync_status: 'Pending',
  });

  console.log(`Created second order with orderId: ${offlineOrder.orderId}`);
  const syncResult3 = await syncOrderToOMS(offlineOrder);
  console.log('Sync result (offline):', syncResult3);

  const reloadedOffline = await Order.findById(offlineOrder._id);
  console.log('Offline order sync status:', reloadedOffline?.sync_status);
  console.log('Offline order error message:', reloadedOffline?.sync_error);
  if (!syncResult3 && reloadedOffline?.sync_status === 'Failed' && reloadedOffline?.sync_error) {
    console.log('✓ Success: Offline error handled gracefully without failing checkout.');
  } else {
    console.error('✗ Failure: Offline handling failed.');
    process.exit(1);
  }

  // 5. Test retry mechanism
  console.log('\n--- Test 5: Testing retry mechanism (Restoring API and running retry) ---');
  // Restore correct API URL
  delete process.env.OMS_API_URL;

  const retryResult = await syncPendingOrders();
  console.log('Retry result:', JSON.stringify(retryResult, null, 2));

  const retriedOffline = await Order.findById(offlineOrder._id);
  console.log('Retried order sync status:', retriedOffline?.sync_status);

  if (retryResult.succeeded > 0 && retriedOffline?.sync_status === 'Synced') {
    console.log('✓ Success: Retry mechanism successfully synced pending orders.');
  } else {
    console.error('✗ Failure: Retry mechanism failed.');
    process.exit(1);
  }

  // 6. Verify sync logs
  console.log('\n--- Test 6: Checking sync logs ---');
  const logs = await OmsSyncLog.find({ websiteOrderId: offlineOrder.orderId });
  console.log(`Found ${logs.length} logs for offline order.`);
  logs.forEach((log, index) => {
    console.log(`Log ${index + 1}: Status = ${log.httpStatus}, Error = ${log.error}`);
  });

  if (logs.length > 0) {
    console.log('✓ Success: Logs successfully stored.');
  } else {
    console.error('✗ Failure: Logging failed.');
    process.exit(1);
  }

  console.log('\n=====================================');
  console.log('ALL OMS SYNC TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test runner exception:', err);
  process.exit(1);
});
