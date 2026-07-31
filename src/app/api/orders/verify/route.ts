import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { paymentLogger } from '@/lib/logger';
import {
  razorpay,
  validatePaymentSignature,
  validateRazorpayOrderEntity,
  validateRazorpayPaymentEntity,
  type RazorpayEntityValidation,
} from '@/lib/razorpay';
import { finalizePaidOrder } from '@/lib/services/paymentSync';
import Order from '@/models/Order';

type VerifyPaymentPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  dbOrderId?: string;
};

const verificationRetryDelays = [250, 750];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndValidateRazorpayEntities(expected: {
  paymentId: string;
  orderId: string;
  amount: number;
}): Promise<RazorpayEntityValidation> {
  let latestValidation: RazorpayEntityValidation = {
    valid: false,
    retryable: true,
    reason: 'Razorpay has not confirmed the payment yet',
  };

  for (let attempt = 0; attempt <= verificationRetryDelays.length; attempt += 1) {
    const [payment, razorpayOrder] = await Promise.all([
      razorpay.payments.fetch(expected.paymentId),
      razorpay.orders.fetch(expected.orderId),
    ]);

    const paymentValidation = validateRazorpayPaymentEntity(payment, expected);
    const orderValidation = validateRazorpayOrderEntity(razorpayOrder, expected);
    if (paymentValidation.valid && orderValidation.valid) {
      return { valid: true, retryable: false };
    }

    latestValidation = !paymentValidation.valid ? paymentValidation : orderValidation;
    if (!latestValidation.retryable || attempt === verificationRetryDelays.length) {
      break;
    }
    await wait(verificationRetryDelays[attempt]);
  }

  return latestValidation;
}

export async function POST(req: Request) {
  let payload: VerifyPaymentPayload;
  try {
    payload = (await req.json()) as VerifyPaymentPayload;
  } catch (error) {
    paymentLogger.warn({ event: 'VERIFY_PAYMENT_INVALID_JSON', error });
    return NextResponse.json({ success: false, error: 'Invalid verification request' }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = payload;
  paymentLogger.info({
    event: 'VERIFY_PAYMENT_ATTEMPT',
    orderId: dbOrderId,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    paymentLogger.warn({
      event: 'VERIFY_PAYMENT_MISSING_DATA',
      orderId: dbOrderId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    return NextResponse.json(
      { success: false, error: 'Missing payment verification data', retryable: false },
      { status: 400 }
    );
  }

  if (dbOrderId && !mongoose.isValidObjectId(dbOrderId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid order reference', retryable: false },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // The database record is authoritative. Razorpay explicitly requires using
    // the server-stored order id when calculating the Checkout signature.
    const storedOrder = dbOrderId
      ? await Order.findById(dbOrderId)
      : await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!storedOrder) {
      paymentLogger.warn({
        event: 'VERIFY_ORDER_NOT_FOUND',
        orderId: dbOrderId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { success: false, error: 'Order not found', retryable: true },
        { status: 404 }
      );
    }

    const storedRazorpayOrderId = String(storedOrder.razorpayOrderId || '');
    if (storedRazorpayOrderId !== razorpay_order_id || storedOrder.paymentMethod === 'COD') {
      paymentLogger.error({
        event: 'VERIFY_ORDER_ID_MISMATCH',
        orderId: storedOrder._id.toString(),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        details: { storedRazorpayOrderId },
      });
      return NextResponse.json(
        { success: false, error: 'Payment does not belong to this order', retryable: false },
        { status: 400 }
      );
    }

    const isAuthentic = validatePaymentSignature({
      razorpay_order_id: storedRazorpayOrderId,
      razorpay_payment_id,
      razorpay_signature,
    });
    if (!isAuthentic) {
      paymentLogger.error({
        event: 'VERIFY_PAYMENT_SIGNATURE_INVALID',
        orderId: storedOrder._id.toString(),
        razorpayOrderId: storedRazorpayOrderId,
        razorpayPaymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { success: false, error: 'Payment signature could not be verified', retryable: false },
        { status: 400 }
      );
    }

    const isSimulated =
      storedRazorpayOrderId.startsWith('rzp_mock_') && process.env.NODE_ENV !== 'production';
    const amount = Math.round(Number(storedOrder.totalAmount) * 100);

    if (!isSimulated) {
      let providerValidation;
      try {
        providerValidation = await fetchAndValidateRazorpayEntities({
          paymentId: razorpay_payment_id,
          orderId: storedRazorpayOrderId,
          amount,
        });
      } catch (error) {
        paymentLogger.error({
          event: 'VERIFY_RAZORPAY_API_FAILED',
          orderId: storedOrder._id.toString(),
          razorpayOrderId: storedRazorpayOrderId,
          razorpayPaymentId: razorpay_payment_id,
          error,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Razorpay confirmation is temporarily unavailable. Please retry verification.',
            retryable: true,
          },
          { status: 502 }
        );
      }

      if (!providerValidation.valid) {
        paymentLogger.warn({
          event: 'VERIFY_RAZORPAY_ENTITY_REJECTED',
          orderId: storedOrder._id.toString(),
          razorpayOrderId: storedRazorpayOrderId,
          razorpayPaymentId: razorpay_payment_id,
          details: { reason: providerValidation.reason, retryable: providerValidation.retryable },
        });
        return NextResponse.json(
          {
            success: false,
            error: providerValidation.retryable
              ? 'Payment is still being confirmed. Please retry verification.'
              : 'Payment details did not match this order.',
            retryable: providerValidation.retryable,
          },
          { status: providerValidation.retryable ? 409 : 400 }
        );
      }
    }

    paymentLogger.info({
      event: 'PAYMENT_VERIFIED',
      orderId: storedOrder._id.toString(),
      razorpayOrderId: storedRazorpayOrderId,
      razorpayPaymentId: razorpay_payment_id,
      amount: storedOrder.totalAmount,
      details: { signatureVerified: true, providerVerified: !isSimulated },
    });

    const result = await finalizePaidOrder({
      orderId: storedRazorpayOrderId,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      source: 'checkout',
    });

    if (result.status === 'not_found') {
      return NextResponse.json(
        { success: false, error: 'Order not found during payment update', retryable: true },
        { status: 404 }
      );
    }
    if (result.status === 'payment_conflict') {
      return NextResponse.json(
        { success: false, error: 'Payment has already been assigned to another order', retryable: false },
        { status: 409 }
      );
    }
    if (result.status === 'oms_failed') {
      return NextResponse.json(
        { success: false, error: (result as any).error || 'Unable to create order in OMS. Please contact support or retry.', retryable: true },
        { status: 502 }
      );
    }

    const completedOrder = result.order as {
      _id: { toString(): string };
      orderId?: string;
      status?: string;
    };
    paymentLogger.info({
      event: 'CUSTOMER_REDIRECT_READY',
      orderId: completedOrder._id.toString(),
      razorpayOrderId: storedRazorpayOrderId,
      razorpayPaymentId: razorpay_payment_id,
      status: completedOrder.status,
    });

    return NextResponse.json({
      success: true,
      message: result.status === 'already_paid' ? 'Payment already verified' : 'Payment verified and order confirmed',
      orderId: completedOrder.orderId || storedOrder.orderId,
      dbOrderId: completedOrder._id.toString(),
      paymentId: razorpay_payment_id,
      status: completedOrder.status,
    });
  } catch (error) {
    paymentLogger.error({
      event: 'VERIFY_PAYMENT_EXCEPTION',
      orderId: dbOrderId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      error,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Payment verification could not be completed. Please retry.',
        retryable: true,
      },
      { status: 500 }
    );
  }
}
