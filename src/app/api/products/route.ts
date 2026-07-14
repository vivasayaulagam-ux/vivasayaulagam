import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/authHelper';
import { normalizeImageUrl, normalizeProductImage, normalizeSinglePath } from '@/lib/utils';
import { getProducts } from '@/lib/productService';
import { normalizeProductPayload, normalizeProductOutput } from '@/lib/pricing';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');
    const view = searchParams.get('view');
    const statusToUse = searchParams.get('status') || 'active';
    const categorySlug = searchParams.get('category');
    const maxPriceStr = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sort') || 'Featured';

    const result = await getProducts({
      category: categorySlug || undefined,
      maxPrice: maxPriceStr || undefined,
      sort: sortBy,
      page: pageStr || undefined,
      limit: limitStr || undefined,
      status: statusToUse,
      view: view || undefined,
    });

    return NextResponse.json({ 
      success: true, 
      products: result.products,
      totalProducts: result.totalProducts,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      maxProductPriceLimit: result.maxProductPriceLimit,
      pagination: {
        totalProducts: result.totalProducts,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        limit: result.limit
      }
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
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
