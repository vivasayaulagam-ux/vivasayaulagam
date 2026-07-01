import './loadEnv';
import dbConnect from '../src/lib/db';
import User from '../src/models/User';
import Product from '../src/models/Product';
import Category from '../src/models/Category';
import Coupon from '../src/models/Coupon';
import CourierCharge from '../src/models/CourierCharge';
import Review from '../src/models/Review';
import Order from '../src/models/Order';
import Setting from '../src/models/Setting';
import Page from '../src/models/Page';
import AboutSection from '../src/models/AboutSection';
import Newsletter from '../src/models/Newsletter';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { generateOrderToken } from '../src/lib/orderToken';

const BASE_URL = 'http://localhost:3000';

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  fixed: number;
}

const stats: TestStats = {
  total: 0,
  passed: 0,
  failed: 0,
  fixed: 0
};

const failedEndpoints: string[] = [];

async function setupAccounts() {
  console.log('--- Setting up Mock Accounts in Database ---');
  await dbConnect();

  const password = 'testpassword123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Setup Admin using save() to trigger pre-save hooks
  const adminEmail = 'admin@vivasayaulagam.com';
  let dbAdmin = await User.findOne({ email: adminEmail });
  if (!dbAdmin) {
    dbAdmin = new User({ email: adminEmail });
  }
  dbAdmin.name = 'Mock Admin';
  dbAdmin.password = hashedPassword;
  dbAdmin.role = 'admin';
  dbAdmin.emailVerified = true;
  await dbAdmin.save();
  console.log('✓ Admin account configured:', adminEmail);

  // Setup Standard User using save() to trigger pre-save hooks
  const userEmail = 'user@vivasayaulagam.com';
  let dbUser = await User.findOne({ email: userEmail });
  if (!dbUser) {
    dbUser = new User({ email: userEmail });
  }
  dbUser.name = 'Mock User';
  dbUser.password = hashedPassword;
  dbUser.role = 'user';
  dbUser.emailVerified = true;
  await dbUser.save();
  console.log('✓ Standard user account configured:', userEmail);
  
  return dbUser;
}

async function loginAdmin() {
  console.log('\n--- Authenticating Admin ---');
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'vivasaya@2024'
    })
  });

  if (!res.ok) {
    throw new Error(`Admin login failed with status ${res.status}`);
  }

  const cookies = res.headers.getSetCookie();
  const tokenCookie = cookies.find(c => c.startsWith('admin_token='));
  if (!tokenCookie) {
    throw new Error('Admin login failed: No admin_token cookie received');
  }

  const adminToken = tokenCookie.split(';')[0];
  console.log('✓ Admin authenticated successfully.');
  return adminToken;
}

async function generateUserSessionCookie(userId: string, email: string, role: string) {
  const secret = process.env.NEXTAUTH_SECRET || 'my_super_secret_random_string_123_safe_secret';
  const token = {
    id: userId,
    name: 'Mock User',
    email: email,
    role: role
  };
  const encoded = await encode({
    token,
    secret,
  });
  return `next-auth.session-token=${encoded}`;
}

async function runApiTest(
  name: string,
  path: string,
  method: string,
  cookie: string,
  options: {
    body?: any;
    expectedStatus?: number;
    description?: string;
  } = {}
) {
  stats.total++;
  const expectedStatus = options.expectedStatus ?? 200;
  const start = Date.now();

  try {
    const headers: Record<string, string> = {};
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const duration = Date.now() - start;
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // Not JSON response
    }

    if (res.status === expectedStatus) {
      console.log(`[PASS] [${duration}ms] ${method} ${path} -> Expected ${expectedStatus}, Got ${res.status}`);
      stats.passed++;
      return { success: true, status: res.status, json, duration };
    } else {
      console.error(`[FAIL] [${duration}ms] ${method} ${path} -> Expected ${expectedStatus}, Got ${res.status}`);
      console.error('Response:', json || 'No JSON response');
      stats.failed++;
      failedEndpoints.push(`${method} ${path} (Expected ${expectedStatus}, Got ${res.status})`);
      return { success: false, status: res.status, json, duration };
    }
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`[FAIL] [${duration}ms] ${method} ${path} -> Request thrown:`, err.message || err);
    stats.failed++;
    failedEndpoints.push(`${method} ${path} (Request error)`);
    return { success: false, status: 0, json: null, duration };
  }
}

async function runAudit() {
  const dbUser = await setupAccounts();
  const adminCookie = await loginAdmin();
  const userCookie = await generateUserSessionCookie(dbUser._id.toString(), dbUser.email, 'user');

  console.log('\n==================================================');
  console.log('API AUDIT STARTED');
  console.log('==================================================');

  // Clear mock data if any
  await Product.deleteMany({ title: /Mock Product/ });
  await Category.deleteMany({ name: /Mock Category/ });

  // Create standard categories & products for verification
  const category = await Category.create({
    name: 'Mock Category',
    slug: 'mock-category',
    status: 'active'
  });

  const product = await Product.create({
    title: 'Mock Product A',
    price: 150,
    sku: 'MOCK-PROD-A',
    quantity: 50,
    status: 'active',
    weight: 250,
    weightUnit: 'g',
    category: category._id,
    isPhysical: true
  });

  const courierCharge = await CourierCharge.create({
    state_name: 'Tamil Nadu',
    state_code: 'TN',
    courier_charge: 50,
    minimum_order_value: 0,
    free_shipping_above: 500,
    status: 'active'
  });

  const coupon = await Coupon.create({
    code: 'MOCK50',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 200,
    isActive: true
  });

  // 1. PUBLIC APIs
  console.log('\n--- 1. Public Endpoints ---');
  await runApiTest('Test DB Connection', '/api/test-db-connection', 'GET', '');
  await runApiTest('Get Public Settings', '/api/settings', 'GET', '');
  await runApiTest('Get Public Products List', '/api/products', 'GET', '');
  await runApiTest('Get Specific Product Details', `/api/products/${product._id}`, 'GET', '');
  await runApiTest('Get Specific Product Details - Not Found', '/api/products/60d21b4667d0d8992e610111', 'GET', '', { expectedStatus: 404 });
  await runApiTest('Get Categories List', '/api/categories', 'GET', '');
  await runApiTest('Get About Section', '/api/about-section', 'GET', '');
  await runApiTest('Get Reels', '/api/social/instagram/reels', 'GET', '');

  // Calculate Shipping
  await runApiTest('Calculate Shipping - Valid', `/api/shipping/calculate?state=Tamil%20Nadu&subtotal=100&weight=0.25`, 'GET', '');

  // 2. AUTHENTICATION / REGISTRATION FLOWS (Simulating Success & Failures)
  console.log('\n--- 2. Auth & Registration Endpoints ---');
  await runApiTest('Auth - Missing register OTP fields', '/api/auth/register', 'POST', '', { body: {}, expectedStatus: 400 });
  await runApiTest('Auth - Invalid login password', '/api/auth/login-password', 'POST', '', { body: { email: 'bad@email.com', password: 'wrong' }, expectedStatus: 401 });
  await runApiTest('Auth - Send OTP missing email', '/api/auth/otp/send', 'POST', '', { body: {}, expectedStatus: 400 });

  // 3. USER APIs (NextAuth Session Guarded)
  console.log('\n--- 3. User Endpoints (Guarded) ---');
  // GET Profile
  await runApiTest('User Profile - Guest Unauthorized', '/api/user/profile', 'GET', '', { expectedStatus: 401 });
  await runApiTest('User Profile - Authenticated', '/api/user/profile', 'GET', userCookie);
  
  // PATCH Profile
  await runApiTest('Update Profile - Missing fields', '/api/user/profile', 'PATCH', userCookie, { body: {}, expectedStatus: 400 });
  await runApiTest('Update Profile - Success', '/api/user/profile', 'PATCH', userCookie, { body: { name: 'New Mock Name', phone: '9876543210' } });

  // User Addresses
  await runApiTest('User Addresses - GET', '/api/user/addresses', 'GET', userCookie);
  const addrPost = await runApiTest('User Address - POST', '/api/user/addresses', 'POST', userCookie, {
    body: { label: 'Home', line1: '123 test address', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', phone: '9876543210', fullName: 'Mock FullName' }
  });
  
  // Default Address
  await runApiTest('Set Default Address', '/api/account/default-address', 'POST', userCookie, {
    body: { label: 'Home', fullName: 'Mock FullName', phone: '9876543210', addressLine1: '123 test address', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' }
  });
  await runApiTest('Get Default Address', '/api/customer/default-address', 'GET', userCookie);

  // Reviews
  await runApiTest('Reviews - GET for product', `/api/reviews?productId=${product._id}`, 'GET', '');
  
  const reviewPostGuest = await runApiTest('Review - POST Guest Success', '/api/reviews', 'POST', '', {
    body: { product_id: String(product._id), customer_name: 'Mock Guest', email: 'guest@gmail.com', rating: 5, comment: 'Great product! Highly recommend.' },
    expectedStatus: 201
  });
  const reviewPostUser = await runApiTest('Review - POST Authenticated Success', '/api/reviews', 'POST', userCookie, {
    body: { product_id: String(product._id), customer_name: 'Mock User', email: 'user@vivasayaulagam.com', rating: 5, comment: 'Great product! Highly recommend.' },
    expectedStatus: 201
  });

  const reviewId = reviewPostUser.json?.review?._id || reviewPostUser.json?.data?._id;
  if (reviewId) {
    // Delete Review requires admin cookie
    await runApiTest('Review - DELETE', `/api/reviews/${reviewId}`, 'DELETE', adminCookie);
  }

  // 4. ADMIN APIs (Custom JWT admin_token Guarded)
  console.log('\n--- 4. Admin Endpoints (Guarded) ---');
  
  // Coupons Admin APIs
  await runApiTest('Admin Coupons - GET Guest Unauthorized', '/api/admin/coupons', 'GET', '', { expectedStatus: 401 });
  await runApiTest('Admin Coupons - GET Admin Success', '/api/admin/coupons', 'GET', adminCookie);
  
  const couponPost = await runApiTest('Admin Coupon - POST Admin Success', '/api/admin/coupons', 'POST', adminCookie, {
    body: { code: 'NEWYEAR2027', discountType: 'percentage', discountValue: 15, minOrderValue: 500 },
    expectedStatus: 201
  });
  const newCouponId = couponPost.json?.coupon?._id;
  if (newCouponId) {
    await runApiTest('Admin Coupon - PUT Success', `/api/admin/coupons/${newCouponId}`, 'PUT', adminCookie, {
      body: { discountValue: 20 }
    });
    await runApiTest('Admin Coupon - DELETE Success', `/api/admin/coupons/${newCouponId}`, 'DELETE', adminCookie);
  }

  // Courier Admin APIs
  await runApiTest('Admin Courier - GET Success', '/api/admin/courier', 'GET', adminCookie);
  const courierPost = await runApiTest('Admin Courier - POST Success', '/api/admin/courier', 'POST', adminCookie, {
    body: { state_name: 'Kerala', state_code: 'KL', courier_charge: 60, minimum_order_value: 100, free_shipping_above: 1000, status: 'active' },
    expectedStatus: 201
  });
  const newCourierId = courierPost.json?.courierCharge?._id || courierPost.json?.rule?._id;
  if (newCourierId) {
    await runApiTest('Admin Courier - DELETE Success', `/api/admin/courier/${newCourierId}`, 'DELETE', adminCookie);
  }

  // Settings Admin APIs
  await runApiTest('Admin Settings - POST Update Settings', '/api/admin/settings', 'POST', adminCookie, {
    body: { review_approval_required: true }
  });
  
  // OMS Retry Admin API
  await runApiTest('Admin OMS Sync Retry - POST Success', '/api/admin/oms-sync/retry', 'POST', adminCookie);

  // About Section Admin API
  await runApiTest('Admin About Section - PUT Success', '/api/admin/about-section', 'PUT', adminCookie, {
    body: {
      smallLabel: 'ABOUT VIVASAYA ULAGAM',
      mainHeading: 'Rooted in Tradition. Delivered with Trust.',
      paragraph1: 'At Vivasaya Ulagam, we bring traditional South Indian food products...',
      mainImage: '/about-us.png',
      ctaButtonText: 'Shop Now',
      ctaButtonLink: '/shop',
      trustCards: [
        { icon: 'leaf', title: '100% Natural Products', isActive: true, sortOrder: 1 }
      ]
    }
  });

  // Pages Admin API
  await runApiTest('Admin Pages - GET Success', '/api/pages', 'GET', '');
  const pagePost = await runApiTest('Admin Page - POST Success', '/api/pages', 'POST', adminCookie, {
    body: { title: 'About Us Mock', slug: 'about-us-mock', content: '<p>About us content</p>', status: 'published' },
    expectedStatus: 201
  });
  const newPageId = pagePost.json?.page?._id || pagePost.json?.data?._id;
  if (newPageId) {
    await runApiTest('Admin Page - GET Details', `/api/pages/${newPageId}`, 'GET', '');
    await runApiTest('Admin Page - PUT Success', `/api/pages/${newPageId}`, 'PUT', adminCookie, {
      body: { title: 'About Us Mock Updated' }
    });
    await runApiTest('Admin Page - DELETE Success', `/api/pages/${newPageId}`, 'DELETE', adminCookie);
  }

  // Instagram Reels Admin API
  const reelPost = await runApiTest('Admin Reels - POST Success', '/api/social/instagram/reels', 'POST', adminCookie, {
    body: { videoUrl: 'https://instagram.com/p/mock', title: 'Test Reel', status: 'active', products: [product._id] },
    expectedStatus: 201
  });
  const newReelId = reelPost.json?.reel?._id || reelPost.json?.data?._id;
  if (newReelId) {
    await runApiTest('Admin Reels - DELETE Success', `/api/social/instagram/reels/${newReelId}`, 'DELETE', adminCookie);
  }

  // 5. TRANSACTIONAL / ORDERS APIs
  console.log('\n--- 5. Orders & Transactional Endpoints ---');
  
  // Create Order COD
  await Setting.findOneAndUpdate({ key: 'cod_enabled' }, { value: 1 }, { upsert: true }); // Ensure COD is active
  
  // Subtotal = 150. Weight = 0.25kg. Courier Charge TN = 50 (Slab). Total = 150 + 50 = 200.
  const computedTotal = 200.0;

  const orderPost = await runApiTest('Create Order COD', '/api/orders/create', 'POST', '', {
    body: {
      items: [{ id: String(product._id), name: 'Mock Product A - 250g', price: 150, quantity: 1 }],
      totalAmount: computedTotal,
      shippingAddress: {
        fullName: 'Mock User',
        address: '123 test address',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        phone: '9876543210',
        email: 'user@vivasayaulagam.com'
      },
      isCod: true,
      paymentMethod: 'COD'
    }
  });

  const orderId = orderPost.json?.dbOrderId;
  const viuOrderId = orderPost.json?.orderId; // This is the human-readable viuOrderId from backend response
  const orderToken = orderPost.json?.token;

  if (orderId) {
    // Verify Order - expects simulated parameters
    await runApiTest('Verify Order Payment', '/api/orders/verify', 'POST', '', {
      body: {
        dbOrderId: orderId,
        razorpay_order_id: 'rzp_mock_12345',
        razorpay_payment_id: 'pay_mock_12345',
        razorpay_signature: 'mock_signature'
      }
    });

    // Track Order
    await runApiTest('Track Order', `/api/orders/track?orderId=${viuOrderId}`, 'GET', '');

    // Get Admin Orders (GET /api/orders) expects user session cookie (the user who owns the orders)
    await runApiTest('Admin Orders - GET Success', '/api/orders', 'GET', userCookie);

    // Update Admin Order Status (PATCH)
    await runApiTest('Admin Order Update Status', '/api/admin/orders/status', 'PATCH', adminCookie, {
      body: { orderId: orderId, status: 'delivered' }
    });

    // Get Invoice
    await runApiTest('Download Order Invoice', `/api/orders/invoice?orderId=${orderId}`, 'GET', userCookie);

    // Get Guest Order Details
    await runApiTest('Get Guest Order Details', `/api/orders/guest?id=${orderId}&token=${orderToken}`, 'GET', '');
  }

  // Contact & Newsletter
  await runApiTest('Submit Contact Form', '/api/contact', 'POST', '', {
    body: { name: 'Visitor', email: 'visitor@gmail.com', phone: '9876543210', message: 'Hello!' }
  });

  const newsletterEmail = `newsletter_${Date.now()}@gmail.com`;
  await runApiTest('Subscribe Newsletter', '/api/newsletter', 'POST', '', {
    body: { email: newsletterEmail },
    expectedStatus: 201
  });

  // Clean up DB records added
  await Category.findByIdAndDelete(category._id);
  await Product.findByIdAndDelete(product._id);
  await CourierCharge.findByIdAndDelete(courierCharge._id);
  await Coupon.findByIdAndDelete(coupon._id);
  await Newsletter.deleteOne({ email: newsletterEmail });
  if (orderId) {
    await Order.findByIdAndDelete(orderId);
  }

  console.log('\n==================================================');
  console.log('AUDIT COMPLETED SUMMARY');
  console.log('==================================================');
  console.log('Total APIs Found/Tested:', stats.total);
  console.log('APIs Working (Passed):', stats.passed);
  console.log('Failed APIs:', stats.failed);
  console.log('APIs Fixed:', stats.fixed);
  
  if (failedEndpoints.length > 0) {
    console.error('\nFAILED ENDPOINTS:');
    failedEndpoints.forEach(f => console.error(`- ${f}`));
  } else {
    console.log('\n🎉 ALL APIS WORKING SUCCESSFULLY!');
  }
  
  process.exit(failedEndpoints.length > 0 ? 1 : 0);
}

runAudit().catch(err => {
  console.error('Audit runner error:', err);
  process.exit(1);
});
