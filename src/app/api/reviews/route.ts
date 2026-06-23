import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

async function updateProductRating(productId: any) {
  if (!productId) return;
  const { default: mongoose } = await import('mongoose');
  if (!mongoose.Types.ObjectId.isValid(productId)) return;
  const targetId = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

  const reviews = await Review.find({
    $or: [
      { product_id: targetId },
      { product_id: targetId.toString() }
    ],
    status: 'approved'
  });
  const reviewCount = reviews.length;
  let averageRating = 0;
  if (reviewCount > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    averageRating = Number((sum / reviewCount).toFixed(1));
  }
  await Product.findByIdAndUpdate(targetId, {
    rating: averageRating,
    reviewCount: reviewCount
  });
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (productId) {
      // Fetch approved reviews for a specific product (Public)
      const { default: mongoose } = await import('mongoose');
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return NextResponse.json({ success: true, reviews: [] });
      }
      const reviews = await Review.find({ product_id: productId, status: 'approved' })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, reviews });
    } else {
      // Require admin authentication for listing all reviews (Admin panel)
      try {
        await requireAdmin();
      } catch (authError: any) {
        return NextResponse.json({ error: authError.message || 'Unauthorized' }, { status: authError.status || 401 });
      }

      const reviews = await Review.find()
        .populate('product_id', 'title')
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json({ success: true, reviews });
    }
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const { product_id, customer_name, email, rating, comment } = body;

    // Server-side validation
    if (!product_id) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }
    const { default: mongoose } = await import('mongoose');
    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return NextResponse.json({ success: false, error: 'Invalid Product ID format' }, { status: 400 });
    }
    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid email address format' }, { status: 400 });
    }
    if (rating === undefined || rating === null) {
      return NextResponse.json({ success: false, error: 'Rating is required' }, { status: 400 });
    }
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }
    if (!comment || !comment.trim()) {
      return NextResponse.json({ success: false, error: 'Review comment is required' }, { status: 400 });
    }
    if (comment.trim().length < 10) {
      return NextResponse.json({ success: false, error: 'Review comment must be at least 10 characters long' }, { status: 400 });
    }

    // Verify product exists
    const productExists = await Product.findById(product_id).lean();
    if (!productExists) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Default status: pending if admin approval is needed, approved if reviews should show immediately
    const Setting = (await import('@/models/Setting')).default;
    const approvalSetting = await Setting.findOne({ key: 'review_approval_required' }).lean();
    const approvalRequired = approvalSetting ? approvalSetting.value !== false : true; // Default to true (pending)
    const status = approvalRequired ? 'pending' : 'approved';

    const review = await Review.create({
      product_id,
      customer_name: customer_name.trim(),
      email: email.trim(),
      rating: ratingNum,
      comment: comment.trim(),
      status,
    });

    if (status === 'approved') {
      await updateProductRating(product_id);
    }

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
