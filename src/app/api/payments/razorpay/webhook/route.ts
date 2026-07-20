import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { paymentLogger } from '@/lib/logger';
import { validateWebhookSignature } from '@/lib/razorpay';
import { finalizePaidOrder } from '@/lib/services/paymentSync';
import Order from '@/models/Order';

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        method?: string;
        email?: string;
        contact?: string;
        error_code?: string;
        error_description?: string;
        created_at?: number;
      };
    };
    order?: {
      entity?: {
        id?: string;
        amount?: number;
        status?: string;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        amount?: number;
        status?: string;
      };
    };
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || req.headers.get('X-Razorpay-Signature') || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'vivasaya@2024';

  paymentLogger.info({
    event: 'WEBHOOK_RECEIVED',
    details: { hasSignature: Boolean(signature), url: '/api/payments/razorpay/webhook' },
  });

  // 1. Signature Verification
  const isSignatureValid = signature && validateWebhookSignature(rawBody, signature, webhookSecret);
  paymentLogger.info({
    event: 'WEBHOOK_SIGNATURE_VERIFICATION',
    details: { valid: Boolean(isSignatureValid) },
  });

  if (!isSignatureValid) {
    paymentLogger.error({
      event: 'WEBHOOK_SIGNATURE_INVALID',
      details: { signatureProvided: Boolean(signature) },
    });
    return NextResponse.json({ error: 'Invalid X-Razorpay-Signature' }, { status: 400 });
  }

  // 2. Parse Payload
  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch (parseErr) {
    paymentLogger.error({
      event: 'WEBHOOK_PAYLOAD_PARSE_ERROR',
      error: parseErr,
    });
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventType = payload.event || 'unknown';
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;
  const refundEntity = payload.payload?.refund?.entity;

  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id || '';
  const razorpayPaymentId = paymentEntity?.id || refundEntity?.payment_id || '';

  paymentLogger.info({
    event: 'WEBHOOK_EVENT_DISPATCH',
    razorpayOrderId,
    razorpayPaymentId,
    details: { eventType },
  });

  try {
    await dbConnect();

    // 3. Handle Payment Successful Events (payment.authorized, payment.captured, order.paid)
    if (eventType === 'payment.captured' || eventType === 'order.paid' || eventType === 'payment.authorized') {
      if (!razorpayOrderId || !razorpayPaymentId) {
        paymentLogger.warn({
          event: 'WEBHOOK_MISSING_PAYMENT_IDENTITY',
          razorpayOrderId,
          razorpayPaymentId,
          details: { eventType },
        });
        return NextResponse.json(
          { status: 'success', message: 'Event received but missing order/payment ID' },
          { status: 200 }
        );
      }

      // Check if order exists in DB
      const dbOrder = await Order.findOne({
        $or: [{ razorpayOrderId }, { orderId: razorpayOrderId }],
      });

      if (!dbOrder) {
        paymentLogger.warn({
          event: 'WEBHOOK_ORDER_NOT_FOUND',
          razorpayOrderId,
          razorpayPaymentId,
          details: { eventType },
        });
        // Return 200 OK so Razorpay does not retry endlessly if manual test or non-existent order
        return NextResponse.json(
          { status: 'success', message: 'Webhook received; order not found in database' },
          { status: 200 }
        );
      }

      // Idempotency Check: if order is already paid with this payment ID
      if (dbOrder.isPaid && dbOrder.razorpayPaymentId === razorpayPaymentId) {
        paymentLogger.info({
          event: 'WEBHOOK_ALREADY_PROCESSED',
          orderId: dbOrder._id.toString(),
          razorpayOrderId,
          razorpayPaymentId,
          status: dbOrder.status,
          details: { eventType, isPaid: dbOrder.isPaid },
        });
        return NextResponse.json(
          { status: 'already_processed', message: 'Order payment already updated' },
          { status: 200 }
        );
      }

      // Atomically update order: isPaid = true, status = 'confirmed', paidAt, razorpayPaymentId
      const syncResult = await finalizePaidOrder({
        orderId: dbOrder.razorpayOrderId || razorpayOrderId,
        paymentId: razorpayPaymentId,
        source: 'webhook',
      });

      paymentLogger.info({
        event: 'WEBHOOK_DATABASE_UPDATE_STATUS',
        orderId: dbOrder._id.toString(),
        razorpayOrderId,
        razorpayPaymentId,
        status: dbOrder.status,
        details: { resultStatus: syncResult.status, eventType },
      });

      return NextResponse.json(
        {
          status: 'success',
          event: eventType,
          message: 'Payment processed and order updated successfully',
          orderId: dbOrder.orderId || dbOrder._id.toString(),
        },
        { status: 200 }
      );
    }

    // 4. Handle Payment Failed Event
    if (eventType === 'payment.failed') {
      paymentLogger.warn({
        event: 'WEBHOOK_PAYMENT_FAILED_LOGGED',
        razorpayOrderId,
        razorpayPaymentId,
        details: {
          errorCode: paymentEntity?.error_code,
          errorDescription: paymentEntity?.error_description,
        },
      });

      return NextResponse.json(
        { status: 'success', event: eventType, message: 'Payment failure logged' },
        { status: 200 }
      );
    }

    // 5. Handle Refund Events
    if (eventType === 'refund.created' || eventType === 'refund.processed') {
      paymentLogger.info({
        event: 'WEBHOOK_REFUND_EVENT_LOGGED',
        razorpayOrderId,
        razorpayPaymentId,
        details: {
          refundId: refundEntity?.id,
          amount: refundEntity?.amount,
          status: refundEntity?.status,
          eventType,
        },
      });

      return NextResponse.json(
        { status: 'success', event: eventType, message: 'Refund event logged' },
        { status: 200 }
      );
    }

    // 6. Generic Fallback for Other Subscribed Events
    paymentLogger.info({
      event: 'WEBHOOK_EVENT_ACKNOWLEDGED',
      details: { eventType },
    });

    return NextResponse.json(
      { status: 'success', event: eventType, message: 'Webhook event acknowledged' },
      { status: 200 }
    );
  } catch (error) {
    paymentLogger.error({
      event: 'WEBHOOK_EXCEPTION',
      razorpayOrderId,
      razorpayPaymentId,
      details: { eventType },
      error,
    });

    // Return 200 OK so Razorpay webhook delivery log records success while logging exception internally
    return NextResponse.json(
      { status: 'error', message: 'Internal error processing webhook' },
      { status: 200 }
    );
  }
}
