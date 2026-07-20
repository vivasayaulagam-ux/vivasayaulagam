import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

/**
 * Validates frontend payment signature returned by Razorpay Checkout.
 */
export function validatePaymentSignature({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  // Handle simulated / test mock signatures in non-production
  if (razorpay_order_id.startsWith('rzp_mock_') && process.env.NODE_ENV !== 'production') {
    return razorpay_signature === 'mock_signature';
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpay_signature)
  );
}

/**
 * Validates Razorpay Webhook signature sent in x-razorpay-signature header.
 */
export function validateWebhookSignature(
  rawBody: string,
  webhookSignature: string,
  webhookSecret?: string
): boolean {
  if (!rawBody || !webhookSignature) {
    return false;
  }

  const secret =
    webhookSecret ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'dummy_secret';

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(webhookSignature)
  );
}
