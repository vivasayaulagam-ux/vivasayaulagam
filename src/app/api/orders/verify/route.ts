import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { sendEmail, sendAdminNotification } from '@/lib/email';
import { syncOrderToOMS } from '@/lib/services/omsSync';
import { validatePaymentSignature } from '@/lib/razorpay';
import { paymentLogger } from '@/lib/logger';

type VerifyPaymentPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  dbOrderId?: string;
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as VerifyPaymentPayload;
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
        details: { payload },
      });
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    const isAuthentic = validatePaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isAuthentic) {
      paymentLogger.error({
        event: 'VERIFY_PAYMENT_SIGNATURE_INVALID',
        orderId: dbOrderId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        details: { receivedSignature: razorpay_signature },
      });
      return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
    }

    await dbConnect();

    // Find query can look up by Mongo dbOrderId OR by razorpay_order_id
    const queryConditions: any[] = [{ razorpayOrderId: razorpay_order_id }];
    if (dbOrderId) {
      queryConditions.push({ _id: dbOrderId });
    }

    const filter = {
      $or: queryConditions,
      isPaid: false,
    };

    // Atomic update to mark as paid and status as confirmed
    const order = await Order.findOneAndUpdate(
      filter,
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        isPaid: true,
        paidAt: new Date(),
        status: 'confirmed',
      },
      { new: true }
    ).populate('user');

    if (order) {
      paymentLogger.info({
        event: 'PAYMENT_VERIFIED_SUCCESSFULLY',
        orderId: order._id.toString(),
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        status: order.status,
        amount: order.totalAmount,
      });

      // Deduct stock for online orders upon payment verification
      try {
        const { deductOrderStock } = await import('@/lib/inventory');
        await deductOrderStock(order.items);
      } catch (stockErr) {
        paymentLogger.error({
          event: 'VERIFY_STOCK_DEDUCTION_FAILED',
          orderId: order._id.toString(),
          error: stockErr,
        });
      }

      // Sync to OMS
      try {
        await syncOrderToOMS(order);
      } catch (omsErr) {
        paymentLogger.error({
          event: 'VERIFY_OMS_SYNC_FAILED',
          orderId: order._id.toString(),
          error: omsErr,
        });
      }

      // Notifications
      sendAdminNotification(
        `New Order Paid - ${order.orderId || order._id}`,
        `<h1>New Paid Order Received!</h1><p>Order ID: ${order.orderId || order._id}</p><p>Amount Paid: ₹${order.totalAmount}</p><p>Razorpay Payment ID: ${razorpay_payment_id}</p>`
      ).catch((emailErr) =>
        paymentLogger.error({
          event: 'ADMIN_EMAIL_FAILED',
          orderId: order._id.toString(),
          error: emailErr,
        })
      );

      const orderUser = order.user as { email?: string } | null;
      const orderEmail = order.shippingAddress?.email || orderUser?.email;
      if (orderEmail && !orderEmail.includes('@guest.vivasayaulagam.com')) {
        sendEmail(
          orderEmail,
          'Order Confirmation - Vivasaya Ulagam',
          `<h1>Thank you for your payment!</h1><p>Your order (${order.orderId || order._id}) is confirmed and being processed.</p><p>Amount Paid: ₹${order.totalAmount}</p>`
        ).catch((emailErr) =>
          paymentLogger.error({
            event: 'CUSTOMER_EMAIL_FAILED',
            orderId: order._id.toString(),
            error: emailErr,
          })
        );
      }

      return NextResponse.json({ success: true, message: 'Payment verified and order confirmed successfully' });
    } else {
      // Check if already paid (idempotency)
      const existingOrder = await Order.findOne({
        $or: queryConditions,
      });

      if (existingOrder && existingOrder.isPaid) {
        paymentLogger.info({
          event: 'VERIFY_PAYMENT_ALREADY_PROCESSED',
          orderId: existingOrder._id.toString(),
          razorpayOrderId: existingOrder.razorpayOrderId,
          status: existingOrder.status,
        });
        return NextResponse.json({ success: true, message: 'Payment already verified' });
      }

      paymentLogger.warn({
        event: 'VERIFY_ORDER_NOT_FOUND',
        orderId: dbOrderId,
        razorpayOrderId: razorpay_order_id,
      });
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
  } catch (error) {
    paymentLogger.error({
      event: 'VERIFY_PAYMENT_EXCEPTION',
      error,
    });
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to verify payment: ${message}` }, { status: 500 });
  }
}
