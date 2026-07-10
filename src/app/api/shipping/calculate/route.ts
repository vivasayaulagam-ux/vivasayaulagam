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
    const itemsStr = searchParams.get('items') || '[]';

    let items: any[] = [];
    try {
      items = JSON.parse(itemsStr);
    } catch (e) {
      console.error('Failed to parse items in calculate shipping:', e);
    }

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

    let resolvedCourierCharge = 0;

    if (items.length > 0) {
      const productIds = items.map((i: any) => i.productId).filter(Boolean);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).select('product_type courier_charge').lean();
      const productsMap = new Map(dbProducts.map((p: any) => [p._id.toString(), p]));

      let comboCourierChargeTotal = 0;
      let normalWeightKg = 0;

      for (const item of items) {
        const dbProduct = productsMap.get(item.productId) as any;
        if (dbProduct && dbProduct.product_type === 'combo') {
          const charge = typeof dbProduct.courier_charge === 'number' ? dbProduct.courier_charge : 80;
          comboCourierChargeTotal += charge * item.quantity;
        } else {
          normalWeightKg += (item.weightKg || 0.25) * item.quantity;
        }
      }

      let normalCourierCharge = 0;
      if (normalWeightKg > 0) {
        if (matchingRule && subtotal >= (matchingRule.minimum_order_value || 0)) {
          if (matchingRule.free_shipping_above !== null && matchingRule.free_shipping_above !== undefined && subtotal >= matchingRule.free_shipping_above) {
            normalCourierCharge = 0;
          } else {
            normalCourierCharge = resolveSlabCharge(normalWeightKg, state || matchingRule.state_name || '', matchingRule.slabs);
          }
        } else {
          normalCourierCharge = resolveSlabCharge(normalWeightKg, state || '', []);
        }
      }

      resolvedCourierCharge = comboCourierChargeTotal + normalCourierCharge;
    } else {
      // Fallback weight based logic if items list is empty or not passed
      if (matchingRule && subtotal >= (matchingRule.minimum_order_value || 0)) {
        if (matchingRule.free_shipping_above !== null && matchingRule.free_shipping_above !== undefined && subtotal >= matchingRule.free_shipping_above) {
          resolvedCourierCharge = 0;
        } else {
          resolvedCourierCharge = resolveSlabCharge(weight, state || matchingRule.state_name || '', matchingRule.slabs);
        }
      } else {
        resolvedCourierCharge = resolveSlabCharge(weight, state || '', []);
      }
    }

    return NextResponse.json({ success: true, courier_charge: resolvedCourierCharge, rate_per_kg: 0, ruleUsed: matchingRule });
  } catch (error: any) {
    console.error('Calculate shipping API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate shipping charge' }, { status: 500 });
  }
}
