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
  | { status: 'not_found' | 'payment_conflict'; order?: Record<string, unknown> & { _id: { toString(): string } } };

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

  try {
    await syncOrderToOMS(order);
  } catch (error) {
    paymentLogger.error({
      event: 'PAYMENT_OMS_SYNC_FAILED',
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
 * Atomically marks one order paid. Checkout verification and webhooks share this
 * function so only the request that wins the isPaid:false update runs fulfilment.
 */
export async function finalizePaidOrder({
  orderId,
  paymentId,
  signature,
  source,
  paidAt = new Date(),
}: FinalizePaymentInput): Promise<FinalizePaymentResult> {
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

  const fields: Record<string, unknown> = {
    razorpayPaymentId: paymentId,
    isPaid: true,
    paidAt,
    status: 'confirmed',
  };
  if (signature) {
    fields.razorpaySignature = signature;
  }

  let updatedOrder;
  try {
    updatedOrder = await Order.findOneAndUpdate(
      {
        razorpayOrderId: orderId,
        isPaid: false,
        $or: [
          { razorpayPaymentId: { $exists: false } },
          { razorpayPaymentId: null },
          { razorpayPaymentId: '' },
          { razorpayPaymentId: paymentId },
        ],
      },
      { $set: fields },
      { new: true, runValidators: true }
    ).populate('user');
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      paymentLogger.error({
        event: 'PAYMENT_ID_UNIQUE_CONFLICT',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        details: { source },
        error,
      });
      return { status: 'payment_conflict' };
    }
    throw error;
  }

  if (!updatedOrder) {
    const existingOrder = await Order.findOne({ razorpayOrderId: orderId }).populate('user');
    if (!existingOrder) {
      return { status: 'not_found' };
    }

    if (existingOrder.isPaid && existingOrder.razorpayPaymentId === paymentId) {
      if (signature && !existingOrder.razorpaySignature) {
        await Order.updateOne(
          { _id: existingOrder._id, isPaid: true, razorpayPaymentId: paymentId, razorpaySignature: { $exists: false } },
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

    return { status: 'payment_conflict', order: existingOrder.toObject() };
  }

  const dbOrderId = updatedOrder._id.toString();
  paymentLogger.info({
    event: 'PAYMENT_DATABASE_UPDATED',
    orderId: dbOrderId,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    amount: updatedOrder.totalAmount,
    status: updatedOrder.status,
    details: { source, isPaid: updatedOrder.isPaid },
  });
  paymentLogger.info({
    event: 'ORDER_CONFIRMED',
    orderId: dbOrderId,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    status: updatedOrder.status,
    details: { source },
  });

  await runPaidOrderSideEffects(updatedOrder, source);
  return { status: 'updated', order: updatedOrder.toObject() };
}
