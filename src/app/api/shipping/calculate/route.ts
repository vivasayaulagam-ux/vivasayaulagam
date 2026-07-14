import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CourierCharge from '@/models/CourierCharge';
import Product from '@/models/Product';
import { normalizeComboWeightKg, resolveSlabCharge } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state')?.trim() || '';
    const pincode = searchParams.get('pincode')?.trim() || '';
    const subtotal = Number(searchParams.get('subtotal') || '0');
    const weight = Number(searchParams.get('weight') || '0');
    const itemsStr = searchParams.get('items') || '[]';

    if (!state) {
      return NextResponse.json({ success: true, courier_charge: null, stateRequired: true });
    }

    let items: any[] = [];
    try {
      items = JSON.parse(itemsStr);
    } catch (e) {
      console.error('Failed to parse items in calculate shipping:', e);
    }

    await dbConnect();

    const activeRules = await CourierCharge.find({ status: 'active' }).lean();
    let matchingRule: any = null;

    if (pincode) {
      matchingRule = activeRules.find((r: any) => r.pincode && r.pincode.trim() === pincode);
    }

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

    if (!matchingRule && state) {
      matchingRule = activeRules.find((r: any) =>
        (r.state_name && r.state_name.toLowerCase() === state.toLowerCase()) ||
        (r.state_code && r.state_code.toLowerCase() === state.toLowerCase())
      );
    }

    let totalWeightKg = 0;
    let isComboCart = false;
    let comboShippingCharge = 0;

    if (items.length > 0) {
      const productIds = items.map((i: any) => i.productId).filter(Boolean);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).select('product_type courier_charge comboWeight weight weightUnit unit').lean();
      const productsMap = new Map(dbProducts.map((p: any) => [p._id.toString(), p]));

      for (const item of items) {
        const dbProduct = productsMap.get(item.productId) as any;
        let itemWeight = 0.25;
        if (dbProduct) {
          if (dbProduct.product_type === 'combo') {
            isComboCart = true;
            if (dbProduct.courier_charge > 0) {
              comboShippingCharge += dbProduct.courier_charge * item.quantity;
            }
            itemWeight = normalizeComboWeightKg(
              dbProduct.comboWeight !== undefined ? dbProduct.comboWeight : dbProduct.weight,
              dbProduct.weightUnit || dbProduct.unit || 'kg'
            );
          } else {
            itemWeight = item.weightKg || 0.25;
          }
        } else {
          itemWeight = item.weightKg || 0.25;
        }
        totalWeightKg += itemWeight * item.quantity;
      }
    } else {
      totalWeightKg = weight;
    }

    let resolvedCourierCharge = 0;

    if (isComboCart) {
      resolvedCourierCharge = comboShippingCharge;
    } else {
      const ruleApplies = matchingRule && subtotal >= (matchingRule.minimum_order_value || 0);
      const isFreeShipping = ruleApplies &&
        matchingRule.free_shipping_above !== null &&
        matchingRule.free_shipping_above !== undefined &&
        subtotal >= matchingRule.free_shipping_above;

      if (!isFreeShipping) {
        resolvedCourierCharge = resolveSlabCharge(
          totalWeightKg,
          state || matchingRule?.state_name || '',
          ruleApplies ? matchingRule.slabs : []
        );
      }
    }

    return NextResponse.json({ success: true, courier_charge: resolvedCourierCharge, rate_per_kg: 0, ruleUsed: matchingRule });
  } catch (error: any) {
    console.error('Calculate shipping API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate shipping charge' }, { status: 500 });
  }
}
