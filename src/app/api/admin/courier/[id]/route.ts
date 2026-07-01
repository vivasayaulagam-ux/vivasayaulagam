import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CourierCharge from '@/models/CourierCharge';
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

    // Normalize numeric values
    const slabs = Array.isArray(body.slabs)
      ? body.slabs.map((s: any) => ({
          weight_start_g: Number(s.weight_start_g || 0),
          weight_end_g: Number(s.weight_end_g || 0),
          charge: Number(s.charge || 0)
        }))
      : [];

    const ruleData = {
      ...body,
      pincode_start: body.pincode_start ? Number(body.pincode_start) : undefined,
      pincode_end: body.pincode_end ? Number(body.pincode_end) : undefined,
      courier_charge: Number(body.courier_charge || 0),
      slabs,
      minimum_order_value: body.minimum_order_value ? Number(body.minimum_order_value) : 0,
      free_shipping_above: body.free_shipping_above ? Number(body.free_shipping_above) : null,
    };

    const updatedRule = await CourierCharge.findByIdAndUpdate(id, ruleData, { new: true });
    if (!updatedRule) {
      return NextResponse.json({ success: false, error: 'Courier rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule: updatedRule });
  } catch (error: any) {
    console.error('Update courier rule error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update courier rule' }, { status: 400 });
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

    const deletedRule = await CourierCharge.findByIdAndDelete(id);
    if (!deletedRule) {
      return NextResponse.json({ success: false, error: 'Courier rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Courier rule deleted successfully' });
  } catch (error: any) {
    console.error('Delete courier rule error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete courier rule' }, { status: 400 });
  }
}
