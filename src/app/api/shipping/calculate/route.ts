import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CourierCharge from '@/models/CourierCharge';
import Product from '@/models/Product';
import { normalizeComboWeightKg, calculateCartShipping } from '@/lib/shipping';

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

    let resolvedCourierCharge = 0;
    const resolvedItems = [];

    if (items.length > 0) {
      const productIds = items.map((i: any) => i.productId).filter(Boolean);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).select('product_type courier_charge comboWeight weight weightUnit unit state_courier_charges isFreeShipping').lean();
      const productsMap = new Map(dbProducts.map((p: any) => [p._id.toString(), p]));

      for (const item of items) {
        const dbProduct = productsMap.get(item.productId) as any;
        let itemWeight = 0.25;
        if (dbProduct) {
          if (dbProduct.product_type === 'combo') {
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

        resolvedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          weightKg: itemWeight,
          state_courier_charges: dbProduct?.state_courier_charges,
          courier_charge: dbProduct?.courier_charge,
          product_type: dbProduct?.product_type,
          isFreeShipping: Boolean(dbProduct?.isFreeShipping),
        });
      }
    } else if (weight > 0) {
      resolvedItems.push({
        productId: 'dummy',
        quantity: 1,
        weightKg: weight,
      });
    }

    resolvedCourierCharge = calculateCartShipping(resolvedItems, state, subtotal, matchingRule);

    return NextResponse.json({ success: true, courier_charge: resolvedCourierCharge, rate_per_kg: 0, ruleUsed: matchingRule });
  } catch (error: any) {
    console.error('Calculate shipping API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to calculate shipping charge' }, { status: 500 });
  }
}
