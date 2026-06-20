import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/authHelper';

async function updateProductRating(productId: any) {
  if (!productId) return;
  // Fetch all approved reviews for this product
  const reviews = await Review.find({ product_id: productId, status: 'approved' });
  const reviewCount = reviews.length;
  let averageRating = 0;
  if (reviewCount > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    averageRating = Number((sum / reviewCount).toFixed(1)); // round to 1 decimal place
  }
  // Update Product document
  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    reviewCount: reviewCount
  });
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    const params = await props.params;
    await dbConnect();
    const body = await req.json();

    const { status } = body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid review status' }, { status: 400 });
    }

    const review = await Review.findById(params.id);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    review.status = status;
    await review.save();

    // Recalculate rating and reviewCount for product
    await updateProductRating(review.product_id);

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
    }

    const params = await props.params;
    await dbConnect();

    const review = await Review.findById(params.id);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const productId = review.product_id;
    await Review.findByIdAndDelete(params.id);

    // Recalculate rating and reviewCount for product
    await updateProductRating(productId);

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete review' }, { status: 500 });
  }
}
