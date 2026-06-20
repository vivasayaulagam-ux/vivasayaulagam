import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/authHelper';
import { normalizeImageUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');
    const view = searchParams.get('view');
    const statusToUse = searchParams.get('status') || 'active';

    await dbConnect();
    
    const query: any = {};
    if (statusToUse !== 'all') {
      query.status = statusToUse;
    }

    let products;
    let total = 0;
    let pagination = null;

    const projection = view === 'card'
      ? 'title images category categories price compareAtPrice rating reviewCount collections status weight weightUnit trackInventory quantity createdAt'
      : view === 'search'
      ? 'title images category price status'
      : undefined;

    if (pageStr || limitStr || statusToUse !== 'all') {
      const page = Math.max(1, parseInt(pageStr || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(limitStr || '24', 10)));
      const skip = (page - 1) * limit;
      const [docs, count] = await Promise.all([
        Product.find(query).select(projection || '').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Product.countDocuments(query),
      ]);
      total = count;
      products = docs.map((p: any) => normalizeProductOutput(p));
      pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };
    } else {
      const docs = await Product.find(query).select(projection || '').sort({ createdAt: -1 }).lean();
      products = docs.map((p: any) => normalizeProductOutput(p));
    }

    return NextResponse.json({ 
      success: true, 
      products,
      ...(pagination ? { pagination } : {})
    }, {
      headers: statusToUse === 'active'
        ? { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
        : undefined,
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
    }

    await dbConnect();
    const body = await req.json();
    const createdProduct = await Product.create(normalizeProductPayload(body));
    const product = normalizeProductOutput(createdProduct.toObject ? createdProduct.toObject() : createdProduct);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create product' }, { status: 400 });
  }
}
