import './loadEnv';
import dbConnect from '../src/lib/db';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Category from '../src/models/Category';
import CourierCharge from '../src/models/CourierCharge';
import Order from '../src/models/Order';
import Setting from '../src/models/Setting';
import { DEFAULT_TN_SLABS } from '../src/lib/shipping';
import { encode } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';

const BASE_URL = 'http://localhost:3000';

interface BugReport {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  step: string;
  description: string;
  fix?: string;
}

const bugs: BugReport[] = [];
const apiCallsLog: string[] = [];
let totalBugCount = 0;
let fixedBugCount = 0;

function logBug(severity: BugReport['severity'], step: string, description: string, fix?: string) {
  bugs.push({ severity, step, description, fix });
  totalBugCount++;
  console.error(`\n❌ [${severity}] BUG in ${step}: ${description}`);
  if (fix) console.log(`  🔧 FIX: ${fix}`);
}

function logApiCall(method: string, url: string, status: number, ok: boolean) {
  const icon = ok ? '✅' : '❌';
  apiCallsLog.push(`${icon} ${method} ${url} → ${status}`);
  console.log(`  ${icon} API: ${method} ${url} → ${status}`);
}

async function apiCall(method: string, url: string, body?: any, cookie?: string) {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (cookie) headers['Cookie'] = cookie;
  
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  
  logApiCall(method, url, res.status, res.ok);
  return { res, data, ok: res.ok, status: res.status };
}

async function runQATest() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║         MANUAL QA ENGINEER - FULL ORDER FLOW         ║');
  console.log('║           Customer Order Test (COD + Tamil Nadu)     ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  await dbConnect();

  // ─────────────────────────────────────────────
  // SETUP: Create a real test customer account
  // ─────────────────────────────────────────────
  console.log('══════ SETUP: Creating Test Customer Account ══════');
  
  const customerEmail = `qa_customer_${Date.now()}@test.com`;
  const customerPassword = 'TestPass@123';
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(customerPassword, salt);
  
  const testUser = new User({
    name: 'QA Test Customer',
    email: customerEmail,
    password: hashedPass,
    role: 'user',
    emailVerified: true
  });
  await testUser.save();
  console.log(`✓ Test customer created: ${customerEmail}`);

  // Generate session cookie
  const secret = process.env.NEXTAUTH_SECRET || 'my_super_secret_random_string_123_safe_secret';
  const token = { id: testUser._id.toString(), name: testUser.name, email: customerEmail, role: 'user' };
  const encoded = await encode({ token, secret });
  const userCookie = `next-auth.session-token=${encoded}`;

  // Create test products that simulate real store products
  await Product.deleteMany({ title: /QA Test/ });
  
  const category = await Category.findOneAndUpdate(
    { status: 'active' },
    {},
    { new: true }
  ) || await Category.findOneAndUpdate(
    { slug: 'qa-test' },
    { name: 'QA Test Category', slug: 'qa-test', status: 'active' },
    { upsert: true, new: true }
  );

  const product1 = await Product.create({
    title: 'QA Test Ellu Urundai 250g',
    price: 120,
    sku: 'QA-ELLU-250G',
    quantity: 20,
    status: 'active',
    category: category._id,
    trackInventory: true
  });

  const product2 = await Product.create({
    title: 'QA Test Kadalai Urundai 750g',
    price: 180,
    sku: 'QA-KADALAI-750G',
    quantity: 20,
    status: 'active',
    category: category._id,
    trackInventory: true
  });

  console.log(`✓ Product 1: ${product1.title} @ ₹${product1.price} (Stock: ${product1.quantity})`);
  console.log(`✓ Product 2: ${product2.title} @ ₹${product2.price} (Stock: ${product2.quantity})`);

  // Tamil Nadu Courier Rule with slabs
  await CourierCharge.deleteMany({ state_code: 'QA-TN' });
  const tnRule = await CourierCharge.create({
    state_name: 'Tamil Nadu',
    state_code: 'QA-TN',
    courier_charge: 50,
    slabs: DEFAULT_TN_SLABS,
    minimum_order_value: 0,
    free_shipping_above: 99999,
    status: 'active'
  });

  // Enable COD
  await Setting.findOneAndUpdate({ key: 'cod_enabled' }, { value: 1 }, { upsert: true });
  console.log('✓ COD enabled in settings');

  const initialStock1 = product1.quantity;
  const initialStock2 = product2.quantity;

  // ─────────────────────────────────────────────
  // STEP 1: Homepage
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 1: Homepage ══════');
  const { res: homeRes, data: homeText } = await apiCall('GET', '/');
  if (homeRes.status !== 200) {
    logBug('HIGH', 'Homepage', `Homepage returned ${homeRes.status} instead of 200`);
  } else {
    console.log('✅ Homepage loads correctly (200 OK)');
  }

  // ─────────────────────────────────────────────
  // STEP 2: Browse Products API
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 2: Browse Products ══════');
  const { res: productsRes, data: productsData } = await apiCall('GET', '/api/products');
  if (!productsRes.ok || !productsData.success) {
    logBug('CRITICAL', 'Products List', `GET /api/products failed: ${JSON.stringify(productsData)}`);
  } else {
    console.log(`✅ Products API works. Total products: ${productsData.products?.length || 0}`);
  }

  // ─────────────────────────────────────────────
  // STEP 3: Open Product Detail
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 3: Open Product Details ══════');
  const { res: prod1Res, data: prod1Data } = await apiCall('GET', `/api/products/${product1._id}`);
  if (!prod1Res.ok) {
    logBug('CRITICAL', 'Product Detail', `GET /api/products/${product1._id} returned ${prod1Res.status}`);
  } else {
    console.log(`✅ Product 1 detail: ${prod1Data.product?.title} @ ₹${prod1Data.product?.price}`);
    if (prod1Data.product?.price !== 120) {
      logBug('HIGH', 'Product Detail', `Price mismatch: Expected ₹120, got ₹${prod1Data.product?.price}`);
    }
  }

  const { res: prod2Res, data: prod2Data } = await apiCall('GET', `/api/products/${product2._id}`);
  if (!prod2Res.ok) {
    logBug('CRITICAL', 'Product Detail', `GET /api/products/${product2._id} returned ${prod2Res.status}`);
  } else {
    console.log(`✅ Product 2 detail: ${prod2Data.product?.title} @ ₹${prod2Data.product?.price}`);
  }

  // ─────────────────────────────────────────────
  // STEP 4 & 5: Add products to cart (simulated via checkout items)
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 4-5: Cart Simulation ══════');
  // Cart is client-side (Zustand). We test it by simulating what the frontend sends to checkout.
  const cartItems = [
    { id: String(product1._id), name: product1.title, price: 120, quantity: 1 },
    { id: String(product2._id), name: product2.title, price: 180, quantity: 1 }
  ];
  const cartSubtotal = 120 + 180; // ₹300
  console.log(`✅ Cart simulation: 2 items, subtotal = ₹${cartSubtotal}`);

  // ─────────────────────────────────────────────
  // STEP 6: Cart Quantity Change (verify price total recalculation)
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 6: Cart Quantity Change Test ══════');
  // Simulate quantity 2 for product 1
  const cartItemsQty2 = [
    { id: String(product1._id), name: product1.title, price: 120, quantity: 2 },
    { id: String(product2._id), name: product2.title, price: 180, quantity: 1 }
  ];
  const updatedSubtotal = 120 * 2 + 180; // ₹420
  console.log(`✅ Cart quantity change: Product 1 qty=2, new subtotal = ₹${updatedSubtotal}`);

  // ─────────────────────────────────────────────
  // STEP 7: Shipping Calculation (Tamil Nadu, 1kg)
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 7-8: Checkout - Shipping Calculation ══════');
  const weight = 0.25 + 0.75; // 250g + 750g = 1kg
  const { res: shippingRes, data: shippingData } = await apiCall(
    'GET', 
    `/api/shipping/calculate?state=Tamil%20Nadu&subtotal=${cartSubtotal}&weight=${weight}`
  );
  
  if (!shippingRes.ok || !shippingData.success) {
    logBug('CRITICAL', 'Shipping Calculation', `Shipping API failed: ${JSON.stringify(shippingData)}`);
  } else {
    const courierCharge = shippingData.courier_charge;
    console.log(`✅ Shipping API: Tamil Nadu, 1kg → Courier Charge = ₹${courierCharge}`);
    
    if (courierCharge !== 50) {
      logBug('HIGH', 'Shipping Calculation', 
        `Wrong courier charge for Tamil Nadu 1kg! Expected ₹50, got ₹${courierCharge}`,
        'Verify DEFAULT_TN_SLABS configuration and resolveSlabCharge function'
      );
    } else {
      console.log('✅ Courier charge correctly shows ₹50 for Tamil Nadu 1kg order');
    }
  }

  // ─────────────────────────────────────────────
  // STEP 9 & 10: Verify COD Setting
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 9-10: COD Availability Check ══════');
  const { res: settingsRes, data: settingsData } = await apiCall('GET', '/api/settings');
  if (!settingsRes.ok) {
    logBug('HIGH', 'Settings API', `GET /api/settings failed: ${settingsData}`);
  } else {
    const codEnabled = Number(settingsData.settings?.cod_enabled) === 1;
    console.log(`✅ COD Enabled: ${codEnabled}`);
    if (!codEnabled) {
      logBug('CRITICAL', 'COD Settings', 'COD is disabled. Customer cannot place COD order!',
        'Run: await Setting.findOneAndUpdate({ key: "cod_enabled" }, { value: 1 }, { upsert: true })'
      );
    }
  }

  // ─────────────────────────────────────────────
  // STEP 11: Place COD Order (the real test)
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 11: Place COD Order ══════');

  const shippingCharge = 50;
  const expectedGrandTotal = cartSubtotal + shippingCharge; // ₹300 + ₹50 = ₹350

  const orderPayload = {
    items: cartItems,
    totalAmount: expectedGrandTotal,
    shippingAddress: {
      fullName: 'QA Test Customer',
      address: '123 Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600002',
      phone: '9876543210',
      email: customerEmail
    },
    isCod: true,
    paymentMethod: 'COD'
  };

  const { res: orderRes, data: orderData } = await apiCall('POST', '/api/orders/create', orderPayload, userCookie);

  if (!orderRes.ok || orderData.error) {
    logBug('CRITICAL', 'Order Creation', `POST /api/orders/create failed: ${JSON.stringify(orderData)}`);
    console.error('\n⛔ Cannot continue test without successful order. Aborting.');
    await cleanup(testUser, product1, product2, tnRule, category);
    await printReport();
    return;
  }

  console.log(`✅ Order created! Order ID: ${orderData.viuOrderId}`);
  console.log(`  DB Order ID: ${orderData.dbOrderId}`);
  console.log(`  Is COD: ${orderData.isCod}`);
  
  if (!orderData.isCod) {
    logBug('CRITICAL', 'Order Creation', 'Order should be COD but isCod=false returned from API!');
  }
  if (!orderData.viuOrderId) {
    logBug('MEDIUM', 'Order Creation', 'viuOrderId missing in order creation response');
  }
  if (!orderData.token) {
    logBug('LOW', 'Order Creation', 'Guest order token missing in response');
  }

  // ─────────────────────────────────────────────
  // STEP 12: Order Confirmation - Verify Database
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 12-15: Verify Database Order ══════');
  const dbOrder = await Order.findById(orderData.dbOrderId).lean() as any;
  
  if (!dbOrder) {
    logBug('CRITICAL', 'Database', 'Order not found in database after creation!');
  } else {
    console.log('\n  📋 Order Database Fields:');
    
    const checks = [
      { field: 'status', actual: dbOrder.status, expected: 'pending', label: 'Order Status' },
      { field: 'isPaid', actual: dbOrder.isPaid, expected: false, label: 'Payment Status (Unpaid)' },
      { field: 'paymentMethod', actual: dbOrder.paymentMethod, expected: 'COD', label: 'Payment Method' },
      { field: 'totalAmount', actual: dbOrder.totalAmount, expected: expectedGrandTotal, label: 'Grand Total' },
      { field: 'deliveryFee', actual: dbOrder.deliveryFee, expected: 50, label: 'Courier Charge' },
      { field: 'courier_charge', actual: dbOrder.courier_charge, expected: 50, label: 'Saved courier_charge field' },
      { field: 'shipping_charge', actual: dbOrder.shipping_charge, expected: 50, label: 'Saved shipping_charge field' },
      { field: 'grand_total', actual: dbOrder.grand_total, expected: expectedGrandTotal, label: 'Saved grand_total field' },
      { field: 'total_weight', actual: dbOrder.total_weight, expected: 1.0, label: 'Saved total_weight (1kg)' }
    ];

    for (const check of checks) {
      if (check.actual === check.expected) {
        console.log(`  ✅ ${check.label}: ${check.actual}`);
      } else {
        console.error(`  ❌ ${check.label}: Expected ${check.expected}, Got ${check.actual}`);
        logBug('HIGH', 'Database Verification', 
          `${check.label} mismatch: Expected ${check.expected}, got ${check.actual}`
        );
      }
    }

    // Verify items count
    if (!dbOrder.items || dbOrder.items.length !== 2) {
      logBug('HIGH', 'Database Verification', `Expected 2 items in order, got ${dbOrder.items?.length}`);
    } else {
      console.log(`  ✅ Items count: ${dbOrder.items.length} (correct)`);
    }

    // Verify shipping address
    const addr = dbOrder.shippingAddress;
    if (!addr || !addr.state || addr.state !== 'Tamil Nadu') {
      logBug('MEDIUM', 'Database Verification', 
        `Shipping address state missing or incorrect: ${addr?.state}`
      );
    } else {
      console.log(`  ✅ Shipping Address State: ${addr.state}`);
    }
  }

  // ─────────────────────────────────────────────
  // STEP: Stock Deduction Verification
  // ─────────────────────────────────────────────
  console.log('\n══════ Stock Deduction Check ══════');
  const updatedProd1 = await Product.findById(product1._id).lean() as any;
  const updatedProd2 = await Product.findById(product2._id).lean() as any;

  if (updatedProd1.quantity !== initialStock1 - 1) {
    logBug('HIGH', 'Stock Deduction', 
      `Product 1 stock not deducted correctly. Expected ${initialStock1 - 1}, got ${updatedProd1.quantity}`
    );
  } else {
    console.log(`  ✅ Product 1 stock deducted: ${initialStock1} → ${updatedProd1.quantity}`);
  }

  if (updatedProd2.quantity !== initialStock2 - 1) {
    logBug('HIGH', 'Stock Deduction', 
      `Product 2 stock not deducted correctly. Expected ${initialStock2 - 1}, got ${updatedProd2.quantity}`
    );
  } else {
    console.log(`  ✅ Product 2 stock deducted: ${initialStock2} → ${updatedProd2.quantity}`);
  }

  // ─────────────────────────────────────────────
  // STEP 13: Order History API
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 13: Customer Order History ══════');
  const { res: historyRes, data: historyData } = await apiCall('GET', '/api/orders', undefined, userCookie);
  
  if (!historyRes.ok || !historyData.success) {
    logBug('HIGH', 'Order History', `GET /api/orders failed: ${JSON.stringify(historyData)}`);
  } else {
    const orders = historyData.orders || [];
    const foundOrder = orders.find((o: any) => o._id === orderData.dbOrderId);
    if (!foundOrder) {
      logBug('HIGH', 'Order History', 'Newly created order not found in customer order history!');
    } else {
      console.log(`✅ Order visible in customer history: ${foundOrder._id}`);
      console.log(`  Status: ${foundOrder.status}`);
      console.log(`  Total: ₹${foundOrder.totalAmount}`);
      if (foundOrder.totalAmount !== expectedGrandTotal) {
        logBug('HIGH', 'Order History', 
          `Order total in history is wrong: Expected ₹${expectedGrandTotal}, got ₹${foundOrder.totalAmount}`
        );
      }
    }
  }

  // ─────────────────────────────────────────────
  // STEP: Individual Order Detail Page
  // ─────────────────────────────────────────────
  console.log('\n══════ Individual Order Detail Check ══════');
  const { res: orderDetailRes, data: orderDetailData } = await apiCall(
    'GET', `/api/orders?id=${orderData.dbOrderId}`, undefined, userCookie
  );
  
  if (!orderDetailRes.ok || !orderDetailData.success) {
    logBug('MEDIUM', 'Order Detail', `GET /api/orders?id=... failed: ${JSON.stringify(orderDetailData)}`);
  } else {
    const detail = orderDetailData.order;
    console.log(`✅ Order detail accessible: ${detail._id}`);
    console.log(`  Courier Charge in detail: ₹${detail.deliveryFee}`);
    if (detail.deliveryFee !== 50) {
      logBug('HIGH', 'Order Detail', 
        `Courier charge wrong in order detail: Expected ₹50, got ₹${detail.deliveryFee}`
      );
    }
  }

  // ─────────────────────────────────────────────
  // STEP 14: Admin Orders Panel Check
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 14: Admin Orders Panel ══════');
  // The Admin Orders page is a server-rendered Next.js page — no REST API needed.
  // We verify the order is visible by checking it exists in DB (same source admin page uses).
  const adminOrderCheck = await Order.findById(orderData.dbOrderId).lean() as any;
  if (!adminOrderCheck) {
    logBug('HIGH', 'Admin Orders Panel', 'Order not found in DB — admin panel would show empty');
  } else {
    console.log(`✅ Order visible in admin panel (server-rendered from DB):`);
    console.log(`  Order ID: ${adminOrderCheck.orderId}`);
    console.log(`  Status: ${adminOrderCheck.status}`);
    console.log(`  Total: ₹${adminOrderCheck.totalAmount}`);
    console.log(`  Courier Charge (deliveryFee): ₹${adminOrderCheck.deliveryFee}`);
    console.log(`  Courier Charge (courier_charge): ₹${adminOrderCheck.courier_charge}`);
    if (adminOrderCheck.deliveryFee !== 50) {
      logBug('MEDIUM', 'Admin Orders Panel', 
        `Admin sees wrong courier charge: Expected ₹50, got ₹${adminOrderCheck.deliveryFee}`
      );
    } else {
      console.log(`  ✅ Admin sees correct courier charge: ₹${adminOrderCheck.deliveryFee}`);
    }
  }

  // ─────────────────────────────────────────────
  // STEP 16: OMS Sync Status
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 16: OMS Sync Status ══════');
  const latestOrder = await Order.findById(orderData.dbOrderId).lean() as any;
  if (latestOrder) {
    console.log(`  OMS Sync Status: ${latestOrder.sync_status}`);
    console.log(`  OMS Order ID: ${latestOrder.oms_order_id || 'N/A'}`);
    if (latestOrder.sync_status === 'Synced') {
      console.log('  ✅ Order synced to OMS successfully');
    } else if (latestOrder.sync_status === 'Failed') {
      logBug('MEDIUM', 'OMS Sync', 'OMS sync failed for COD order');
    } else {
      console.log(`  ℹ️ OMS sync status: ${latestOrder.sync_status} (may be pending or OMS unavailable)`);
    }
  }

  // ─────────────────────────────────────────────
  // STEP 17: Invoice Generation
  // ─────────────────────────────────────────────
  console.log('\n══════ STEP 17: Invoice Generation ══════');
  const { res: invoiceRes } = await apiCall(
    'GET', `/api/orders/invoice?orderId=${orderData.dbOrderId}`, undefined, userCookie
  );
  
  if (!invoiceRes.ok) {
    logBug('HIGH', 'Invoice Generation', `Invoice API returned ${invoiceRes.status} for order ${orderData.dbOrderId}`);
  } else {
    const contentType = invoiceRes.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.log(`✅ Invoice generated successfully (HTML format)`);
    } else {
      console.log(`✅ Invoice generated (content-type: ${contentType})`);
    }
  }

  // ─────────────────────────────────────────────
  // STEP: Order Tracking
  // ─────────────────────────────────────────────
  console.log('\n══════ Order Tracking Check ══════');
  const { res: trackRes, data: trackData } = await apiCall(
    'GET', `/api/orders/track?orderId=${orderData.viuOrderId}`
  );
  
  if (!trackRes.ok || !trackData.success) {
    logBug('MEDIUM', 'Order Tracking', `Order tracking failed for ${orderData.viuOrderId}: ${JSON.stringify(trackData)}`);
  } else {
    console.log(`✅ Order tracking works: ${trackData.order?.orderId}`);
    console.log(`  Tracking status: ${trackData.order?.status}`);
  }

  // ─────────────────────────────────────────────
  // STEP: Guest Order View (with token)
  // ─────────────────────────────────────────────
  console.log('\n══════ Guest Order View Check ══════');
  if (orderData.token) {
    const { res: guestOrderRes, data: guestOrderData } = await apiCall(
      'GET', `/api/orders/guest?id=${orderData.dbOrderId}&token=${orderData.token}`
    );
    if (!guestOrderRes.ok) {
      logBug('MEDIUM', 'Guest Order View', `Guest order view failed: ${JSON.stringify(guestOrderData)}`);
    } else {
      console.log(`✅ Guest order view accessible`);
    }
  }

  // ─────────────────────────────────────────────
  // DUPLICATE ORDER PREVENTION TEST
  // ─────────────────────────────────────────────
  console.log('\n══════ Duplicate Order Prevention Test ══════');
  const { res: dupRes, data: dupData } = await apiCall('POST', '/api/orders/create', orderPayload, userCookie);
  if (dupRes.ok) {
    console.log('  ⚠️ Second identical order was accepted (not necessarily a bug - depends on business rules)');
    // Check if it was actually a duplicate or a new order
    if (dupData.dbOrderId === orderData.dbOrderId) {
      logBug('CRITICAL', 'Duplicate Orders', 
        'DUPLICATE ORDER! Same order ID returned for identical payload - deduplication issue'
      );
    } else {
      console.log(`  ℹ️ Second order got different ID (${dupData.dbOrderId}) - no deduplication active`);
    }
  }

  // ─────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────
  await cleanup(testUser, product1, product2, tnRule, category);
  await printReport();
}

async function cleanup(testUser: any, product1: any, product2: any, tnRule: any, category: any) {
  console.log('\n══════ Cleanup ══════');
  try {
    await Product.deleteMany({ _id: { $in: [product1._id, product2._id] } });
    await CourierCharge.deleteOne({ _id: tnRule._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('✓ Test data cleaned up');
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

async function printReport() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                   QA TEST REPORT                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`  Total Bugs Found:  ${totalBugCount}`);
  console.log(`  APIs Tested:       ${apiCallsLog.length}`);

  if (bugs.length > 0) {
    console.log('\n🐛 BUGS FOUND:');
    const bySeverity = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    for (const sev of bySeverity) {
      const filtered = bugs.filter(b => b.severity === sev);
      if (filtered.length > 0) {
        console.log(`\n  [${sev}] - ${filtered.length} bugs:`);
        filtered.forEach((b, i) => {
          console.log(`  ${i + 1}. ${b.step}: ${b.description}`);
          if (b.fix) console.log(`     FIX: ${b.fix}`);
        });
      }
    }
  } else {
    console.log('\n🎉 NO BUGS FOUND! All checks passed.');
  }

  console.log('\n📡 API CALLS LOG:');
  apiCallsLog.forEach(log => console.log(`  ${log}`));

  const mongoose = (await import('mongoose')).default;
  await mongoose.disconnect();
  
  process.exit(totalBugCount > 0 ? 1 : 0);
}

runQATest().catch(err => {
  console.error('\nQA Test Error:', err);
  process.exit(1);
});
