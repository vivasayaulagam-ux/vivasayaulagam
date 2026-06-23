import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { generateOrderToken } from '@/lib/orderToken';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing order ID' }, { status: 400 });
    }

    await dbConnect();

    // Try finding order by database ObjectId first, then by human-readable orderId
    let order: any = null;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (isValidObjectId) {
      order = await Order.findById(id).populate('user').lean();
    }
    if (!order) {
      order = await Order.findOne({ orderId: id }).populate('user').lean();
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Security Verification:
    let isVerified = false;

    // 1. Token-based verification (for seamless redirect from success page)
    if (token && token === generateOrderToken(order._id.toString())) {
      isVerified = true;
    }

    // 2. Email-based verification
    if (!isVerified && email) {
      const cleanInputEmail = email.trim().toLowerCase();
      const shippingEmail = order.shippingAddress?.email?.trim().toLowerCase() || '';
      const userEmail = (order.user as any)?.email?.trim().toLowerCase() || '';

      if (
        (shippingEmail && shippingEmail === cleanInputEmail) ||
        (userEmail && userEmail === cleanInputEmail)
      ) {
        isVerified = true;
      }
    }

    // 3. Phone-based verification
    if (!isVerified && phone) {
      const cleanInputPhone = phone.trim().replace(/\D/g, ''); // strip non-numeric characters
      const shippingPhone = (order.shippingAddress?.phone || '').trim().replace(/\D/g, '');
      const userPhone = ((order.user as any)?.phone || '').trim().replace(/\D/g, '');

      if (
        (shippingPhone && shippingPhone === cleanInputPhone) ||
        (userPhone && userPhone === cleanInputPhone)
      ) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return NextResponse.json(
        { success: false, error: 'Verification required to view guest order details.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Fetch guest order error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
