import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID missing in session' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id') || searchParams.get('orderId');

    if (orderId) {
      const order = await Order.findOne({ user: userId, _id: orderId }).lean();
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Fetch user orders error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
