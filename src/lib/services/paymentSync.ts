import Order from '@/models/Order';
import { sendAdminNotification, sendEmail } from '@/lib/email';
import { paymentLogger } from '@/lib/logger';
import { syncOrderToOMS } from '@/lib/services/omsSync';

export type PaymentSyncSource = 'checkout' | 'webhook';

type FinalizePaymentInput = {
  orderId: string;
  paymentId: string;
  signature?: string;
  source: PaymentSyncSource;
  paidAt?: Date;
};

export type FinalizePaymentResult =
  | { status: 'updated' | 'already_paid'; order: Record<string, unknown> & { _id: { toString(): string } } }
  | { status: 'not_found' | 'payment_conflict' | 'oms_failed'; error?: string; order?: Record<string, unknown> & { _id: { toString(): string } } };

async function runPaidOrderSideEffects(order: any, source: PaymentSyncSource) {
  const dbOrderId = order._id.toString();

  try {
    const { deductOrderStock } = await import('@/lib/inventory');
    await deductOrderStock(order.items);
  } catch (error) {
    paymentLogger.error({
      event: 'PAYMENT_STOCK_DEDUCTION_FAILED',
      orderId: dbOrderId,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      details: { source },
      error,
    });
  }

  sendAdminNotification(
    `New Order Paid - ${order.orderId || dbOrderId}`,
    `<h1>New Paid Order Received!</h1><p>Order ID: ${order.orderId || dbOrderId}</p><p>Amount Paid: ₹${order.totalAmount}</p><p>Razorpay Payment ID: ${order.razorpayPaymentId}</p>`
  ).catch((error) =>
    paymentLogger.error({ event: 'ADMIN_EMAIL_FAILED', orderId: dbOrderId, details: { source }, error })
  );

  const orderUser = order.user as { email?: string } | null;
  const orderEmail = order.shippingAddress?.email || orderUser?.email;
  if (orderEmail && !orderEmail.includes('@guest.vivasayaulagam.com')) {
    sendEmail(
      orderEmail,
      'Order Confirmation - Vivasaya Ulagam',
      `<h1>Thank you for your payment!</h1><p>Your order (${order.orderId || dbOrderId}) is confirmed and being processed.</p><p>Amount Paid: ₹${order.totalAmount}</p>`
    ).catch((error) =>
      paymentLogger.error({ event: 'CUSTOMER_EMAIL_FAILED', orderId: dbOrderId, details: { source }, error })
    );
  }
}

/**
 * Atomically marks one order paid ONLY AFTER OMS API successfully confirms order creation.
 */
export async function finalizePaidOrder({
  orderId,
  paymentId,
  signature,
  source,
  paidAt = new Date(),
}: FinalizePaymentInput): Promise<FinalizePaymentResult> {
  const existingOrder = await Order.findOne({ razorpayOrderId: orderId }).populate('user');
  if (!existingOrder) {
    return { status: 'not_found' };
  }

  // Idempotency Check: if already paid with this payment ID AND synced to OMS
  if (existingOrder.isPaid && existingOrder.razorpayPaymentId === paymentId && existingOrder.sync_status === 'Synced') {
    if (signature && !existingOrder.razorpaySignature) {
      await Order.updateOne(
        { _id: existingOrder._id },
        { $set: { razorpaySignature: signature } }
      );
    }
    paymentLogger.info({
      event: 'PAYMENT_ALREADY_PROCESSED',
      orderId: existingOrder._id.toString(),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      status: existingOrder.status,
      details: { source },
    });
    return { status: 'already_paid', order: existingOrder.toObject() };
  }

  // Check if payment ID has been assigned to a DIFFERENT order
  const paymentAlreadyUsed = await Order.findOne({
    razorpayPaymentId: paymentId,
    razorpayOrderId: { $ne: orderId },
  }).select('_id orderId razorpayOrderId razorpayPaymentId');

  if (paymentAlreadyUsed) {
    paymentLogger.error({
      event: 'PAYMENT_ID_CONFLICT',
      orderId: paymentAlreadyUsed._id.toString(),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      details: { source },
    });
    return { status: 'payment_conflict' };
  }

  // Attach payment details to order object for OMS creation payload
  existingOrder.razorpayPaymentId = paymentId;
  if (signature) {
    existingOrder.razorpaySignature = signature;
  }

  // CRITICAL STEP: Call OMS create-order API BEFORE marking payment completed or status confirmed
  paymentLogger.info({
    event: 'OMS_SYNC_BEFORE_PAYMENT_COMPLETION',
    orderId: existingOrder._id.toString(),
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    details: { source }
  });

  const omsSuccess = await syncOrderToOMS(existingOrder);

  if (!omsSuccess) {
    paymentLogger.error({
      event: 'PAYMENT_COMPLETION_BLOCKED_OMS_FAILED',
      orderId: existingOrder._id.toString(),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      details: { source, sync_error: existingOrder.sync_error }
    });

    // DO NOT mark payment completed. DO NOT mark order confirmed.
    return {
      status: 'oms_failed',
      error: 'Unable to create order in OMS. Please contact support or retry.',
      order: existingOrder.toObject()
    };
  }

  // OMS API returned SUCCESS! Now update local order state in MongoDB to COMPLETED/CONFIRMED
  const fields: Record<string, unknown> = {
    razorpayPaymentId: paymentId,
    isPaid: true,
    paidAt,
    status: 'confirmed',
    sync_status: 'Synced'
  };
  if (signature) {
    fields.razorpaySignature = signature;
  }

  const updatedOrder = await Order.findOneAndUpdate(
    { _id: existingOrder._id },
    { $set: fields },
    { new: true, runValidators: true }
  ).populate('user');

  if (!updatedOrder) {
    return { status: 'not_found' };
  }

  const dbOrderId = updatedOrder._id.toString();
  paymentLogger.info({
    event: 'PAYMENT_COMPLETED_POST_OMS_SUCCESS',
    orderId: dbOrderId,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    amount: updatedOrder.totalAmount,
    status: updatedOrder.status,
    details: { source, isPaid: updatedOrder.isPaid, sync_status: updatedOrder.sync_status },
  });

  await runPaidOrderSideEffects(updatedOrder, source);
  return { status: 'updated', order: updatedOrder.toObject() };
}
