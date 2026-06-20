import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Coupon from '@/models/Coupon';
import { requireAdmin } from '@/lib/authHelper';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const couponData = {
      code: body.code ? String(body.code).toUpperCase().trim() : undefined,
      discountType: body.discountType,
      discountValue: body.discountValue !== undefined ? Number(body.discountValue) : undefined,
      minOrderValue: body.minOrderValue !== undefined ? Number(body.minOrderValue) : undefined,
      isActive: body.isActive,
    };

    // Clean undefined fields to prevent overwriting them with undefined
    Object.keys(couponData).forEach(
      (key) => (couponData as any)[key] === undefined && delete (couponData as any)[key]
    );

    const coupon = await Coupon.findByIdAndUpdate(id, couponData, { new: true, runValidators: true });
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update coupon' }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true });
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error('Patch coupon error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update coupon' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    await dbConnect();
    const { id } = await params;
    
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete coupon' }, { status: 400 });
  }
}
