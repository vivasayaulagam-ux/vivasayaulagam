import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/authHelper';
import { normalizeImageUrl } from '@/lib/utils';

function normalizeProductPayload(body: any) {
  const normalizedImages = Array.isArray(body?.images)
    ? body.images.map((img: string) => normalizeImageUrl(img))
    : body?.image
    ? [normalizeImageUrl(body.image)]
    : [];

  return {
    ...body,
    images: normalizedImages,
    weight: body?.weight === '' || body?.weight === undefined ? 0 : Number(body.weight),
    variants: Array.isArray(body?.variants)
      ? body.variants.map((variant: any) => ({
          ...variant,
          price: variant.price === '' || variant.price === undefined ? undefined : Number(variant.price),
          additionalPrice: variant.additionalPrice === '' || variant.additionalPrice === undefined ? 0 : Number(variant.additionalPrice),
          stock: variant.stock === '' || variant.stock === undefined ? 0 : Number(variant.stock),
        }))
      : [],
    courierRates: body?.courierRates
      ? {
          charge_250g: body.courierRates.charge_250g === '' || body.courierRates.charge_250g === undefined || body.courierRates.charge_250g === null ? null : Number(body.courierRates.charge_250g),
          charge_500g: body.courierRates.charge_500g === '' || body.courierRates.charge_500g === undefined || body.courierRates.charge_500g === null ? null : Number(body.courierRates.charge_500g),
          charge_1kg: body.courierRates.charge_1kg === '' || body.courierRates.charge_1kg === undefined || body.courierRates.charge_1kg === null ? null : Number(body.courierRates.charge_1kg),
          charge_above: body.courierRates.charge_above === '' || body.courierRates.charge_above === undefined || body.courierRates.charge_above === null ? null : Number(body.courierRates.charge_above),
        }
      : null,
  };
}

function normalizeProductOutput(p: any) {
  const isOutOfStock = p.trackInventory && (p.quantity ?? 0) <= 0;
  return {
    ...p,
    images: (p.images || []).map((img: string) => normalizeImageUrl(img)),
    stock_quantity: p.quantity ?? 0,
    stock_status: isOutOfStock ? 'Out of Stock' : 'In Stock',
    is_out_of_stock: isOutOfStock,
  };
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await dbConnect();
    const product = await Product.findById(params.id).lean();
    if (!product) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({ success: true, product: normalizeProductOutput(product) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
    }

    const params = await props.params;
    await dbConnect();
    const body = await req.json();
    const updatedProduct = await Product.findByIdAndUpdate(params.id, normalizeProductPayload(body), { new: true }).lean();
    if (!updatedProduct) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, product: normalizeProductOutput(updatedProduct) });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update product' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
    }

    const params = await props.params;
    await dbConnect();
    await Product.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete product' }, { status: 400 });
  }
}
