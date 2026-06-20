import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/authHelper';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const category = await Category.findByIdAndUpdate(id, body, { new: true });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update category' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
    }

    await dbConnect();
    const { id } = await params;

    // Find the category first
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Check if any products are linked to this category (by slug)
    const linkedProductCount = await Product.countDocuments({ category: category.slug });
    if (linkedProductCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `This category has ${linkedProductCount} product${linkedProductCount > 1 ? 's' : ''}. Please move or delete those products first.`,
        },
        { status: 400 }
      );
    }

    // Also remove any subcategories that belong to this parent
    await Category.deleteMany({ parentId: id });

    // Delete the category
    await Category.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete category' }, { status: 400 });
  }
}
