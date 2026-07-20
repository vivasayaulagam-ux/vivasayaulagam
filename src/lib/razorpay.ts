import crypto from 'crypto';
import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

type PaymentSignatureInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayPaymentSnapshot = {
  id?: string;
  order_id?: string | null;
  amount?: number | string;
  currency?: string;
  status?: string;
  captured?: boolean;
};

export type RazorpayOrderSnapshot = {
  id?: string;
  amount?: number | string;
  amount_paid?: number | string;
  currency?: string;
  status?: string;
};

export type RazorpayEntityValidation = {
  valid: boolean;
  retryable: boolean;
  reason?: string;
};

function safeEqualHex(expectedHex: string, receivedHex: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(receivedHex)) {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const received = Buffer.from(receivedHex, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

/**
 * Validates the Checkout signature against the server-owned Razorpay order id.
 */
export function validatePaymentSignature(
  {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }: PaymentSignatureInput,
  secret = process.env.RAZORPAY_KEY_SECRET
): boolean {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  if (razorpay_order_id.startsWith('rzp_mock_') && process.env.NODE_ENV !== 'production') {
    return razorpay_signature === 'mock_signature';
  }

  if (!secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  return safeEqualHex(expectedSignature, razorpay_signature);
}

/**
 * Webhooks use their own Dashboard-configured secret, not the API key secret.
 */
export function validateWebhookSignature(
  rawBody: string,
  webhookSignature: string,
  webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
): boolean {
  if (!rawBody || !webhookSignature || !webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return safeEqualHex(expectedSignature, webhookSignature);
}

export function validateRazorpayPaymentEntity(
  payment: RazorpayPaymentSnapshot,
  expected: { paymentId: string; orderId: string; amount: number; currency?: string }
): RazorpayEntityValidation {
  if (payment.id !== expected.paymentId) {
    return { valid: false, retryable: false, reason: 'Payment ID does not match' };
  }
  if (payment.order_id !== expected.orderId) {
    return { valid: false, retryable: false, reason: 'Payment is linked to a different order' };
  }
  if (Number(payment.amount) !== expected.amount) {
    return { valid: false, retryable: false, reason: 'Payment amount does not match the order' };
  }
  if ((payment.currency || '').toUpperCase() !== (expected.currency || 'INR').toUpperCase()) {
    return { valid: false, retryable: false, reason: 'Payment currency does not match the order' };
  }
  if (payment.status !== 'captured' || payment.captured !== true) {
    return {
      valid: false,
      retryable: payment.status === 'authorized' || payment.status === 'created',
      reason: `Payment is not captured (status: ${payment.status || 'unknown'})`,
    };
  }

  return { valid: true, retryable: false };
}

export function validateRazorpayOrderEntity(
  order: RazorpayOrderSnapshot,
  expected: { orderId: string; amount: number; currency?: string }
): RazorpayEntityValidation {
  if (order.id !== expected.orderId) {
    return { valid: false, retryable: false, reason: 'Razorpay Order ID does not match' };
  }
  if (Number(order.amount) !== expected.amount) {
    return { valid: false, retryable: false, reason: 'Razorpay order amount does not match' };
  }
  if ((order.currency || '').toUpperCase() !== (expected.currency || 'INR').toUpperCase()) {
    return { valid: false, retryable: false, reason: 'Razorpay order currency does not match' };
  }
  if (order.status !== 'paid' || Number(order.amount_paid) < expected.amount) {
    return {
      valid: false,
      retryable: order.status === 'created' || order.status === 'attempted',
      reason: `Razorpay order is not paid (status: ${order.status || 'unknown'})`,
    };
  }

  return { valid: true, retryable: false };
}
