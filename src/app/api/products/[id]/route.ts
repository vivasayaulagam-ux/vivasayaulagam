import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Review from '@/models/Review';
import { requireAdmin } from '@/lib/authHelper';
import { normalizeImageUrl, normalizeProductImage, normalizeSinglePath } from '@/lib/utils';
import { normalizeProductPayload, normalizeProductOutput } from '@/lib/pricing';


export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await dbConnect();
    let product = null;
    if (mongoose.isValidObjectId(params.id)) {
      product = await Product.findById(params.id).lean();
    }
    if (!product) {
      product = await Product.findOne({ seoSlug: params.id }).lean();
    }
    if (!product) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    
    // Fetch approved reviews for this product with robust $or matching to prevent ObjectId/string mismatch
    const reviews = await Review.find({
      $or: [
        { product_id: product._id },
        { product_id: product._id.toString() }
      ],
      status: 'approved'
    }).lean();
    
    const reviewCount = reviews.length;
    let averageRating = 0;
    if (reviewCount > 0) {
      const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      averageRating = Number((sum / reviewCount).toFixed(1));
    }
    
    const productOutput = {
      ...normalizeProductOutput(product),
      averageRating,
      reviewCount,
      reviews
    };
    
    return NextResponse.json({ success: true, product: productOutput });
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
