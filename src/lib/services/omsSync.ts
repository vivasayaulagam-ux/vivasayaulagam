import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import OmsSyncLog from '@/models/OmsSyncLog';

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

  const OMS_API_URL = process.env.OMS_API_URL || 'http://localhost/OMS/api/create-order.php';
  const OMS_API_TOKEN = process.env.OMS_API_TOKEN || 'test-api-token-123';

  // Load products to fetch SKUs
  const productIds = order.items.map((item: any) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productsMap = new Map(products.map((p: any) => [p._id.toString(), p]));

  // Build items array
  const items = order.items.map((item: any) => {
    const product = productsMap.get(item.productId.toString());
    const sku = product?.sku || '';
    const omsProductId = SKU_TO_OMS_PRODUCT_ID[sku] || 1; // Fallback to 1

    // Extract variation
    let variation = '';
    if (item.name.includes(' - ')) {
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

  let responseBody = '';
  let httpStatus = 0;
  let syncError = '';
  let isSuccess = false;
  let isDuplicate = false;
  let omsData: any = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const response = await fetch(OMS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OMS_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    httpStatus = response.status;
    responseBody = await response.text();

    if (response.ok) {
      try {
        const json = JSON.parse(responseBody);
        if (json.success) {
          isSuccess = true;
          omsData = json.data;
        } else {
          syncError = json.message || 'API rejected request';
        }
      } catch {
        syncError = 'Invalid JSON response';
      }
    } else {
      // Check for duplicate key violation error returned as HTTP error
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
    if (error.name === 'AbortError') {
      syncError = 'Connection timed out';
    } else {
      syncError = error.message || 'Network failure';
    }
    httpStatus = 0;
    responseBody = JSON.stringify({ error: syncError });
  }

  // Update order fields
  try {
    dbOrder.retry_count = (dbOrder.retry_count || 0) + 1;
    dbOrder.last_retry = new Date();

    if (isSuccess) {
      dbOrder.sync_status = 'Synced';
      dbOrder.sync_at = new Date();
      dbOrder.sync_error = undefined;
      if (omsData) {
        dbOrder.oms_order_id = String(omsData.order_id);
        dbOrder.oms_order_number = String(omsData.order_number);
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
      request: JSON.stringify(payload),
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
  
  // Find orders that are paid but pending sync and have failed less than 5 times
  // Find orders that are confirmed (either paid online OR COD) but not synced and have failed less than 5 times
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
