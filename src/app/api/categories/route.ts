import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { requireAdmin } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find()
      .select('name emoji slug bgColor isVisible order parentId image redirectUrl')
      .sort({ order: 1, name: 1 })
      .lean();
    return NextResponse.json({ success: true, categories }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch categories' }, { status: 500 });
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
    if (!body.name || !body.slug) {
      return NextResponse.json({ success: false, error: 'Name and Slug are required' }, { status: 400 });
    }
    const category = await Category.create(body);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create category' }, { status: 400 });
  }
}
