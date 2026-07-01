import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { sendEmail, sendAdminNotification } from '@/lib/email';
import { syncOrderToOMS } from '@/lib/services/omsSync';

type VerifyPaymentPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  dbOrderId?: string;
};

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = (await req.json()) as VerifyPaymentPayload;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !dbOrderId) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    const isSimulated = razorpay_order_id?.startsWith("rzp_mock_") && process.env.NODE_ENV !== 'production';
    let isAuthentic = false;

    if (isSimulated) {
      // Simulate verification for development mode with placeholder keys
      isAuthentic = razorpay_signature === "mock_signature";
    } else {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
        .update(body.toString())
        .digest('hex');

      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (!isAuthentic) {
      return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
    }

    await dbConnect();

    // Update order status only if it hasn't been updated yet to prevent duplicates
    const order = await Order.findOneAndUpdate(
      { _id: dbOrderId, isPaid: false },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        isPaid: true,
        paidAt: new Date(),
        status: 'processing'
      },
      { new: true }
    ).populate('user');

    if (order) {
      // Deduct stock for online orders upon payment verification
      try {
        const { deductOrderStock } = await import('@/lib/inventory');
        await deductOrderStock(order.items);
      } catch (stockErr) {
        console.error("Failed to deduct stock for online order:", stockErr);
      }

      // Sync to OMS immediately
      try {
        await syncOrderToOMS(order);
      } catch (omsErr) {
        console.error("Failed to sync order to OMS synchronously:", omsErr);
      }

      // Fire and forget emails to speed up response
      sendAdminNotification(
        `New Order Placed - ${dbOrderId}`,
        `<h1>New Order Received!</h1><p>Order ID: ${dbOrderId}</p><p>Amount: ₹${order.totalAmount}</p>`
      ).catch(emailErr => console.error("Failed to send admin email:", emailErr));

      const orderUser = order.user as { email?: string } | null;
      const orderEmail = order.shippingAddress?.email || orderUser?.email;
      if (orderEmail && !orderEmail.includes("@guest.vivasayaulagam.com")) {
        sendEmail(
          orderEmail,
          'Order Confirmation - Vivasaya Ulagam',
          `<h1>Thank you for your order!</h1><p>Your order (ID: ${dbOrderId}) has been received and is now processing.</p><p>Amount Paid: ₹${order.totalAmount}</p>`
        ).catch(emailErr => console.error("Failed to send customer email:", emailErr));
      }
    } else {
      // Order might already be paid (duplicate callback), check if it exists and is paid
      const existingOrder = await Order.findById(dbOrderId);
      if (existingOrder && existingOrder.isPaid) {
        // Already paid, safe to return success
        return NextResponse.json({ success: true, message: 'Payment already verified' });
      } else {
        return NextResponse.json({ error: 'Order not found or already processed' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Payment verified successfully' });

  } catch (error) {
    console.error('Error verifying payment:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to verify payment: ${message}` }, { status: 500 });
  }
}
