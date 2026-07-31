import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import OmsSyncLog from '@/models/OmsSyncLog';
import { paymentLogger } from '@/lib/logger';

const SKU_TO_OMS_PRODUCT_ID: Record<string, number> = {
  'PROD-A': 1,
  'PRICKLY-PE': 2,
  'RAVA-LADDU': 3,
  'SATHU-MAAV': 4,
  'SMBAR-POWD': 5,
  'SUNDAKAI-1': 6,
  'AVAARAM-PO': 7
};

export async function syncOrderToOMS(order: any): Promise<boolean> {
  await dbConnect();

  // Double check directly from DB to prevent race conditions
  const dbOrder = await Order.findById(order._id);
  if (!dbOrder) {
    return false;
  }

  if (dbOrder.sync_status === 'Synced') {
    order.sync_status = 'Synced';
    order.oms_order_id = dbOrder.oms_order_id;
    order.oms_order_number = dbOrder.oms_order_number;
    return true;
  }

  const OMS_API_URL = process.env.OMS_API_URL || 'https://omsvivasayaulagam.com/OMS/api/create-order.php';
  const OMS_API_TOKEN = process.env.OMS_API_TOKEN || 'test-api-token-123';

  // Load products to fetch SKUs
  const productIds = (order.items || []).map((item: any) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productsMap = new Map(products.map((p: any) => [p._id.toString(), p]));

  // Build items array
  const items = (order.items || []).map((item: any) => {
    const product = productsMap.get(item.productId.toString());
    const sku = item.sku || product?.sku || '';
    const omsProductId = SKU_TO_OMS_PRODUCT_ID[sku] || 1; // Fallback to 1

    // Extract variation
    let variation = item.variantName || '';
    if (!variation && item.name && item.name.includes(' - ')) {
      variation = item.name.split(' - ').slice(1).join(' - ');
    }

    const weightGrams = item.weightKg ? Math.round(item.weightKg * 1000) : 250; // default to 250g

    return {
      product_id: omsProductId,
      product_variation_id: 0,
      quantity: item.quantity,
      unit_price: item.price,
      weight_grams: weightGrams,
      variation: variation
    };
  });

  const billingAddress = order.shippingAddress || {};

  const payload = {
    customer_name: billingAddress.fullName || 'Guest Customer',
    phone: billingAddress.phone || '0000000000',
    alternate_phone: '',
    whatsapp_number: '',
    email: billingAddress.email || '',
    address_line_1: billingAddress.address || 'N/A',
    address_line_2: billingAddress.addressLine2 || '',
    city: billingAddress.city || 'N/A',
    state: billingAddress.state || 'N/A',
    pincode: billingAddress.postalCode || '000000',
    country: billingAddress.country || 'IN',
    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
    payment_status: order.paymentMethod === 'COD' ? 'Pending' : 'Paid',
    payment_reference: order.paymentMethod === 'COD' ? 'COD' : (order.razorpayPaymentId || 'Prepaid'),
    website_order_id: order.orderId,
    sync_status: 'Synced',
    source: 'Website',
    discount: 0.00,
    product_subtotal: order.subtotalAmount || 0,
    courier_charge: order.deliveryFee || 0,
    final_amount: order.totalAmount || 0,
    items: items
  };

  const payloadString = JSON.stringify(payload);
  let responseBody = '';
  let httpStatus = 0;
  let syncError = '';
  let isSuccess = false;
  let isDuplicate = false;
  let omsData: any = null;

  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts && !isSuccess) {
    attempt++;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s per request timeout

      paymentLogger.info({
        event: 'OMS_SYNC_REQUEST_START',
        orderId: order.orderId || order._id.toString(),
        details: { url: OMS_API_URL, method: 'POST', attempt, maxAttempts, payload }
      });

      const response = await fetch(OMS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OMS_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const executionTimeMs = Date.now() - startTime;
      httpStatus = response.status;
      responseBody = await response.text();

      paymentLogger.info({
        event: 'OMS_SYNC_RESPONSE',
        orderId: order.orderId || order._id.toString(),
        status: String(httpStatus),
        details: { attempt, maxAttempts, httpStatus, executionTimeMs, responseBody }
      });

      if (response.ok) {
        try {
          const json = JSON.parse(responseBody);
          if (json.success) {
            isSuccess = true;
            omsData = json.data || json;
          } else {
            syncError = json.message || 'API rejected request';
          }
        } catch {
          syncError = 'Invalid JSON response from OMS API';
        }
      } else {
        if (
          responseBody.includes('Duplicate entry') ||
          responseBody.includes('1062') ||
          responseBody.includes('uk_orders_external_reference')
        ) {
          isDuplicate = true;
          isSuccess = true;
        } else {
          try {
            const json = JSON.parse(responseBody);
            syncError = json.message || `HTTP ${response.status}`;
          } catch {
            syncError = `HTTP ${response.status}: ${responseBody}`;
          }
        }
      }
    } catch (error: any) {
      const executionTimeMs = Date.now() - startTime;
      const errorStack = error.stack || String(error);
      if (error.name === 'AbortError') {
        syncError = 'Connection timed out after 10 seconds';
      } else {
        syncError = error.message || 'Network failure';
      }
      httpStatus = 0;
      responseBody = JSON.stringify({ error: syncError, stack: errorStack });

      paymentLogger.error({
        event: 'OMS_SYNC_ATTEMPT_FAILED',
        orderId: order.orderId || order._id.toString(),
        details: { attempt, maxAttempts, executionTimeMs, error: syncError, stack: errorStack }
      });
    }

    if (!isSuccess && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Update order fields in MongoDB
  try {
    dbOrder.retry_count = (dbOrder.retry_count || 0) + attempt;
    dbOrder.last_retry = new Date();

    if (isSuccess) {
      dbOrder.sync_status = 'Synced';
      dbOrder.sync_at = new Date();
      dbOrder.sync_error = undefined;
      if (omsData) {
        const extractedOrderId = omsData.order_id || omsData.data?.order_id;
        if (extractedOrderId) {
          dbOrder.oms_order_id = String(extractedOrderId);
          dbOrder.oms_order_number = omsData.order_number ? String(omsData.order_number) : `VIU-${1000 + Number(extractedOrderId)}`;
        }
        dbOrder.oms_response = omsData;
      } else if (isDuplicate) {
        dbOrder.oms_response = { note: 'Duplicate website_order_id detected by OMS' };
      }
    } else {
      dbOrder.sync_status = 'Failed';
      dbOrder.sync_error = syncError;
    }
    await dbOrder.save();
    
    // Update the input object properties to reflect the saved state
    order.sync_status = dbOrder.sync_status;
    order.sync_error = dbOrder.sync_error;
    order.oms_order_id = dbOrder.oms_order_id;
    order.oms_order_number = dbOrder.oms_order_number;
  } catch (dbErr: any) {
    console.error('Failed to update order state in MongoDB:', dbErr);
  }

  // Create Sync Log in MongoDB
  try {
    await OmsSyncLog.create({
      websiteOrderId: order.orderId,
      request: payloadString,
      response: responseBody,
      httpStatus: httpStatus,
      error: isSuccess ? null : syncError
    });
  } catch (logErr) {
    console.error('Failed to save OMS Sync Log:', logErr);
  }

  return isSuccess;
}

export async function syncPendingOrders(): Promise<any> {
  await dbConnect();
  
  const pendingOrders = await Order.find({
    $and: [
      {
        $or: [
          { isPaid: true },
          { paymentMethod: 'COD' }
        ]
      },
      { sync_status: { $ne: 'Synced' } },
      {
        $or: [
          { retry_count: { $lt: 5 } },
          { retry_count: { $exists: false } }
        ]
      }
    ]
  });

  const results = {
    total: pendingOrders.length,
    succeeded: 0,
    failed: 0,
    details: [] as any[]
  };

  for (const order of pendingOrders) {
    try {
      const success = await syncOrderToOMS(order);
      if (success) {
        results.succeeded++;
      } else {
        results.failed++;
      }
      results.details.push({
        orderId: order.orderId,
        status: order.sync_status,
        error: order.sync_error
      });
    } catch (err: any) {
      results.failed++;
      results.details.push({
        orderId: order.orderId,
        status: 'Error',
        error: err.message
      });
    }
  }

  return results;
}
