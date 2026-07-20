import crypto from 'crypto';
import { expect, test } from '@playwright/test';
import {
  validatePaymentSignature,
  validateRazorpayOrderEntity,
  validateRazorpayPaymentEntity,
  validateWebhookSignature,
} from '../src/lib/razorpay';

const secret = 'unit_test_secret';
const orderId = 'order_test_123';
const paymentId = 'pay_test_123';
const amount = 159900;

test('accepts only the signature for the server order and payment IDs', () => {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  expect(
    validatePaymentSignature(
      {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
      secret
    )
  ).toBe(true);
  expect(
    validatePaymentSignature(
      {
        razorpay_order_id: 'order_tampered',
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      },
      secret
    )
  ).toBe(false);
});

test('rejects malformed signatures without throwing', () => {
  expect(
    validatePaymentSignature(
      {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'not-a-valid-signature',
      },
      secret
    )
  ).toBe(false);
});

test('verifies webhook signatures against the dedicated webhook secret', () => {
  const body = JSON.stringify({ event: 'payment.captured' });
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  expect(validateWebhookSignature(body, signature, secret)).toBe(true);
  expect(validateWebhookSignature(body, signature, 'different_secret')).toBe(false);
});

test('requires a captured payment linked to the expected order and amount', () => {
  const validPayment = {
    id: paymentId,
    order_id: orderId,
    amount,
    currency: 'INR',
    status: 'captured',
    captured: true,
  };

  expect(
    validateRazorpayPaymentEntity(validPayment, { paymentId, orderId, amount })
  ).toEqual({ valid: true, retryable: false });
  expect(
    validateRazorpayPaymentEntity(
      { ...validPayment, order_id: 'order_other' },
      { paymentId, orderId, amount }
    )
  ).toMatchObject({ valid: false, retryable: false });
  expect(
    validateRazorpayPaymentEntity(
      { ...validPayment, status: 'authorized', captured: false },
      { paymentId, orderId, amount }
    )
  ).toMatchObject({ valid: false, retryable: true });
});

test('requires the Razorpay order to be fully paid', () => {
  const validOrder = {
    id: orderId,
    amount,
    amount_paid: amount,
    currency: 'INR',
    status: 'paid',
  };

  expect(validateRazorpayOrderEntity(validOrder, { orderId, amount })).toEqual({
    valid: true,
    retryable: false,
  });
  expect(
    validateRazorpayOrderEntity(
      { ...validOrder, status: 'attempted', amount_paid: 0 },
      { orderId, amount }
    )
  ).toMatchObject({ valid: false, retryable: true });
});
