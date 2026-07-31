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
  const OMS_API_URL = process.env.OMS_API_URL || 'https://omsvivasayaulagam.com/OMS/api/create-order.php';
  const OMS_API_TOKEN = process.env.OMS_API_TOKEN || 'test-api-token-123';

  // Build items array directly from order.items
  const items = (order.items || []).map((item: any) => {
    const sku = item.sku || '';
    const omsProductId = SKU_TO_OMS_PRODUCT_ID[sku] || item.product_id || (item.productId && !isNaN(Number(item.productId)) ? Number(item.productId) : 1);

    // Extract variation
    let variation = item.variation || item.variantName || '';
    if (!variation && item.name && item.name.includes(' - ')) {
      variation = item.name.split(' - ').slice(1).join(' - ');
    }

    const weightGrams = item.weight_grams || (item.weightKg ? Math.round(item.weightKg * 1000) : 250);

    return {
      product_id: omsProductId,
      product_variation_id: item.product_variation_id || 0,
      sku: sku || item.sku || '',
      product_name: item.product_name || item.name || 'Product',
      quantity: item.quantity || 1,
      unit_price: item.price || item.unit_price || 0,
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
    website_order_id: order.orderId || order._id?.toString(),
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
        orderId: order.orderId || order._id?.toString(),
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

      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(responseBody);
      } catch {
        parsedJson = null;
      }

      paymentLogger.info({
        event: 'OMS_SYNC_RESPONSE',
        orderId: order.orderId || order._id?.toString(),
        status: String(httpStatus),
        details: { attempt, maxAttempts, httpStatus, executionTimeMs, responseBody, parsedJson }
      });

      if (response.ok) {
        if (parsedJson && parsedJson.success) {
          isSuccess = true;
          omsData = parsedJson.data || parsedJson;
        } else if (parsedJson) {
          syncError = parsedJson.message || parsedJson.error || 'API rejected request';
        } else {
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
        } else if (parsedJson && (parsedJson.message || parsedJson.error)) {
          syncError = parsedJson.message || parsedJson.error;
        } else {
          syncError = `HTTP ${response.status}: ${responseBody}`;
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
        orderId: order.orderId || order._id?.toString(),
        details: { attempt, maxAttempts, executionTimeMs, error: syncError, stack: errorStack }
      });
    }

    if (!isSuccess && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (isSuccess) {
    order.sync_status = 'Synced';
    order.sync_error = undefined;
    if (omsData) {
      const extractedOrderId = omsData.order_id || omsData.data?.order_id;
      if (extractedOrderId) {
        order.oms_order_id = String(extractedOrderId);
        order.oms_order_number = omsData.order_number ? String(omsData.order_number) : `VIU-${1000 + Number(extractedOrderId)}`;
      }
      order.oms_response = omsData;
    } else if (isDuplicate) {
      order.oms_response = { note: 'Duplicate website_order_id detected by OMS' };
    }
  } else {
    order.sync_status = 'Failed';
    order.sync_error = syncError;
  }

  return isSuccess;
}

export async function syncPendingOrders(): Promise<any> {
  return { total: 0, succeeded: 0, failed: 0, details: [] };
}
