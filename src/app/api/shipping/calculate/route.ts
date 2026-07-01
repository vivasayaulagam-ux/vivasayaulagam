import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CourierCharge from '@/models/CourierCharge';
import Setting from '@/models/Setting';
import Product from '@/models/Product';
import { resolveSlabCharge } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state')?.trim() || '';
    const pincode = searchParams.get('pincode')?.trim() || '';
    const subtotal = Number(searchParams.get('subtotal') || '0');
    const weight = Number(searchParams.get('weight') || '0');

    await dbConnect();

    // 1. Fetch active database rules
    const activeRules = await CourierCharge.find({ status: 'active' }).lean();

    let matchingRule: any = null;

    // A. Exact pincode match
    if (pincode) {
      matchingRule = activeRules.find((r: any) => r.pincode && r.pincode.trim() === pincode);
    }

    // B. Pincode range match
    if (!matchingRule && pincode) {
      const pinNum = parseInt(pincode, 10);
      if (Number.isInteger(pinNum)) {
        matchingRule = activeRules.find((r: any) => 
          r.pincode_start !== undefined && 
          r.pincode_end !== undefined && 
          pinNum >= r.pincode_start && 
          pinNum <= r.pincode_end
        );
      }
    }

    // C. State match
    if (!matchingRule && state) {
      matchingRule = activeRules.find((r: any) => 
        (r.state_name && r.state_name.toLowerCase() === state.toLowerCase()) ||
        (r.state_code && r.state_code.toLowerCase() === state.toLowerCase())
      );
    }

    if (matchingRule) {
      // Validate minimum order value constraint
      if (subtotal >= (matchingRule.minimum_order_value || 0)) {
        // Check free shipping threshold
        if (matchingRule.free_shipping_above !== null && matchingRule.free_shipping_above !== undefined && subtotal >= matchingRule.free_shipping_above) {
          return NextResponse.json({ success: true, courier_charge: 0, rate_per_kg: 0, ruleUsed: matchingRule });
        }
        const calculatedCharge = resolveSlabCharge(weight, state || matchingRule.state_name || '', matchingRule.slabs);
        return NextResponse.json({ success: true, courier_charge: calculatedCharge, rate_per_kg: 0, ruleUsed: matchingRule });
      }
    }

    // 2. Fallback to standard weight calculation
    const courierCharge = resolveSlabCharge(weight, state || '', []);

    return NextResponse.json({ success: true, courier_charge: courierCharge, rate_per_kg: 0, fallback: true });
  } catch (error: any) {
    console.error('Calculate shipping API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate shipping charge' }, { status: 500 });
  }
}
