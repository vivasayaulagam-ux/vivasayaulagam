import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    await dbConnect();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error('Fetch coupons error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    await dbConnect();
    const body = await req.json();

    if (!body.code || body.discountValue === undefined) {
      return NextResponse.json({ success: false, error: 'Coupon code and discount value are required' }, { status: 400 });
    }

    // Normalize coupon values
    const couponData = {
      code: String(body.code).toUpperCase().trim(),
      discountType: body.discountType || 'percentage',
      discountValue: Number(body.discountValue),
      minOrderValue: body.minOrderValue ? Number(body.minOrderValue) : 0,
      isActive: body.isActive !== false,
    };

    const coupon = await Coupon.create(couponData);
    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create coupon' }, { status: 400 });
  }
}
