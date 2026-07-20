import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { validateWebhookSignature } from '@/lib/razorpay';
import { paymentLogger } from '@/lib/logger';
import { sendEmail, sendAdminNotification } from '@/lib/email';
import { syncOrderToOMS } from '@/lib/services/omsSync';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    paymentLogger.info({
      event: 'WEBHOOK_RECEIVED',
      details: { hasSignature: !!signature },
    });

    if (!signature) {
      paymentLogger.warn({
        event: 'WEBHOOK_MISSING_SIGNATURE',
      });
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const isValid = validateWebhookSignature(rawBody, signature);
    if (!isValid) {
      paymentLogger.error({
        event: 'WEBHOOK_SIGNATURE_INVALID',
        details: { signature },
      });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      paymentLogger.error({
        event: 'WEBHOOK_PAYLOAD_PARSE_ERROR',
        error: parseError,
      });
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const event = payload.event;
    paymentLogger.info({
      event: 'WEBHOOK_EVENT_DISPATCH',
      details: { webhookEvent: event },
    });

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (!razorpayOrderId) {
        paymentLogger.warn({
          event: 'WEBHOOK_MISSING_ORDER_ID',
          details: { event, payload: payload.payload },
        });
        return NextResponse.json({ status: 'ignored', reason: 'No razorpay_order_id found in event' }, { status: 200 });
      }

      await dbConnect();

      // Check if order exists and if already paid (Idempotency)
      const existingOrder = await Order.findOne({ razorpayOrderId });
      if (!existingOrder) {
        paymentLogger.warn({
          event: 'WEBHOOK_ORDER_NOT_FOUND',
          razorpayOrderId,
          razorpayPaymentId,
        });
        return NextResponse.json({ status: 'ignored', reason: 'Order not found in database' }, { status: 200 });
      }

      if (existingOrder.isPaid) {
        paymentLogger.info({
          event: 'WEBHOOK_ALREADY_PROCESSED',
          orderId: existingOrder._id.toString(),
          razorpayOrderId,
          status: existingOrder.status,
        });
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      // Atomic update
      const updatedOrder = await Order.findOneAndUpdate(
        { razorpayOrderId, isPaid: false },
        {
          isPaid: true,
          status: 'confirmed',
          paidAt: new Date(),
          razorpayPaymentId: razorpayPaymentId || existingOrder.razorpayPaymentId || 'webhook_captured',
        },
        { new: true }
      ).populate('user');

      if (updatedOrder) {
        paymentLogger.info({
          event: 'WEBHOOK_ORDER_UPDATED_CONFIRMED',
          orderId: updatedOrder._id.toString(),
          razorpayOrderId,
          razorpayPaymentId: updatedOrder.razorpayPaymentId,
          amount: updatedOrder.totalAmount,
          status: updatedOrder.status,
        });

        // Deduct inventory stock
        try {
          const { deductOrderStock } = await import('@/lib/inventory');
          await deductOrderStock(updatedOrder.items);
        } catch (stockErr) {
          paymentLogger.error({
            event: 'WEBHOOK_STOCK_DEDUCTION_FAILED',
            orderId: updatedOrder._id.toString(),
            error: stockErr,
          });
        }

        // Sync to OMS
        try {
          await syncOrderToOMS(updatedOrder);
        } catch (omsErr) {
          paymentLogger.error({
            event: 'WEBHOOK_OMS_SYNC_FAILED',
            orderId: updatedOrder._id.toString(),
            error: omsErr,
          });
        }

        // Email notifications
        sendAdminNotification(
          `Order Payment Captured - ${updatedOrder.orderId || updatedOrder._id}`,
          `<h1>Payment Captured via Webhook!</h1><p>Order ID: ${updatedOrder.orderId || updatedOrder._id}</p><p>Amount: ₹${updatedOrder.totalAmount}</p><p>Payment ID: ${razorpayPaymentId}</p>`
        ).catch((emailErr) =>
          paymentLogger.error({
            event: 'WEBHOOK_ADMIN_EMAIL_FAILED',
            orderId: updatedOrder._id.toString(),
            error: emailErr,
          })
        );

        const orderUser = updatedOrder.user as { email?: string } | null;
        const orderEmail = updatedOrder.shippingAddress?.email || orderUser?.email;
        if (orderEmail && !orderEmail.includes('@guest.vivasayaulagam.com')) {
          sendEmail(
            orderEmail,
            'Order Confirmation - Vivasaya Ulagam',
            `<h1>Thank you for your payment!</h1><p>Your order (${updatedOrder.orderId || updatedOrder._id}) is confirmed and being processed.</p><p>Amount Paid: ₹${updatedOrder.totalAmount}</p>`
          ).catch((emailErr) =>
            paymentLogger.error({
              event: 'WEBHOOK_CUSTOMER_EMAIL_FAILED',
              orderId: updatedOrder._id.toString(),
              error: emailErr,
            })
          );
        }
      }

      return NextResponse.json({ status: 'ok', event }, { status: 200 });
    }

    if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      paymentLogger.warn({
        event: 'WEBHOOK_PAYMENT_FAILED_EVENT',
        razorpayOrderId,
        razorpayPaymentId,
        details: { description: paymentEntity?.error_description },
      });

      return NextResponse.json({ status: 'ok', event: 'payment.failed' }, { status: 200 });
    }

    return NextResponse.json({ status: 'ignored', event }, { status: 200 });
  } catch (error) {
    paymentLogger.error({
      event: 'WEBHOOK_EXCEPTION',
      error,
    });
    return NextResponse.json({ error: 'Internal Webhook Error' }, { status: 500 });
  }
}
