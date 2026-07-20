import crypto from 'crypto';
import { validateWebhookSignature } from '../src/lib/razorpay';

async function testWebhookValidation() {
  console.log('=== RAZORPAY WEBHOOK INTEGRATION TEST ===');

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'vivasaya@2024';
  console.log(`Configured Webhook Secret: ${webhookSecret}`);

  const testPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_99887766',
          order_id: 'order_test_11223344',
          amount: 250000,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  };

  const rawBody = JSON.stringify(testPayload);
  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  console.log(`Generated X-Razorpay-Signature: ${generatedSignature}`);

  const isValid = validateWebhookSignature(rawBody, generatedSignature, webhookSecret);
  console.log(`Signature Validation Result: ${isValid ? 'PASSED ✓' : 'FAILED ✗'}`);

  if (isValid) {
    console.log('SUCCESS: Razorpay Webhook signature verification is fully operational.');
  } else {
    console.error('ERROR: Signature verification failed.');
  }
}

testWebhookValidation().catch(console.error);
