import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CourierCharge from '@/models/CourierCharge';
import { requireAdmin } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    await dbConnect();
    const rules = await CourierCharge.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Fetch courier rules error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch courier rules' }, { status: 500 });
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

    const rule = await CourierCharge.create(ruleData);
    return NextResponse.json({ success: true, rule }, { status: 201 });
  } catch (error: any) {
    console.error('Create courier rule error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create courier rule' }, { status: 400 });
  }
}
