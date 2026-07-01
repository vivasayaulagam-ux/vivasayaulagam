import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import mongoose from 'mongoose';

type LeanOrderItem = {
  _id?: { toString: () => string };
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
};

type LeanOrder = {
  _id: { toString: () => string };
  orderId?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: Date;
  items?: LeanOrderItem[];
  shippingAddress?: unknown;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await dbConnect();

    let order: LeanOrder | null = null;
    const upperInput = orderId.trim().toUpperCase();

    // 1. Try exact VIU-style orderId match first
    order = await Order.findOne({ orderId: upperInput })
      .select('orderId status totalAmount createdAt items')
      .lean<LeanOrder | null>();

    // 2. If not found and input looks like a MongoDB ObjectId, try by _id
    if (!order && mongoose.Types.ObjectId.isValid(orderId.trim())) {
      order = await Order.findById(orderId.trim())
        .select('orderId status totalAmount createdAt items')
        .lean<LeanOrder | null>();
    }

    // 3. Try partial _id match (e.g. user has last 8 chars of _id from old system)
    if (!order && orderId.trim().length >= 6 && !upperInput.startsWith('VIU')) {
      order = await Order.findOne({
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: orderId.trim(),
            options: 'i'
          }
        }
      }).select('orderId status totalAmount createdAt items').lean<LeanOrder | null>();
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found. Please enter a valid Order ID like VIU001.' });
    }

    // Serialize for client
    const serialized = {
      ...order,
      _id: order._id.toString(),
      orderId: order.orderId || `#${order._id.toString().slice(-8)}`,
      createdAt: (order.createdAt || new Date()).toISOString(),
      items: order.items?.map((item) => ({ ...item, _id: item._id?.toString() })),
    };

    return NextResponse.json({ success: true, order: serialized });

  } catch (error) {
    console.error('Order tracking error:', error);
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
  }
}
