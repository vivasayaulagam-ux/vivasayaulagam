import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Setting from '@/models/Setting';
import { requireAdmin } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

function normalizeBannerSlides(value: unknown) {
  if (!Array.isArray(value)) return value;
  return value.map((slide) => {
    if (!slide || typeof slide !== 'object') return slide;
    const item = slide as Record<string, unknown>;
    const desktopImage = typeof item.desktopImage === 'string' && item.desktopImage ? item.desktopImage : item.image;
    return { ...item, desktopImage, mobileImage: typeof item.mobileImage === 'string' ? item.mobileImage : '' };
  });
}

export async function GET() {
  try {
    await dbConnect();
    const rows = await Setting.find().select('key value -_id').lean();
    
    // Convert array of settings into a nice key-value object
    const settingsObj: Record<string, any> = {};
    rows.forEach((r: any) => {
      settingsObj[r.key] = r.key === 'banner_slides' ? normalizeBannerSlides(r.value) : r.value;
    });
    
    return NextResponse.json({ success: true, settings: settingsObj }, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message || 'Unauthorized' },
        { status: authError.status || 401 }
      );
    }

    await dbConnect();
    const body = await req.json();
    
    // Save each key-value pair
    const saved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      const normalizedValue = key === 'banner_slides' ? normalizeBannerSlides(value) : value;
      await Setting.findOneAndUpdate(
        { key },
        { key, value: normalizedValue },
        { upsert: true, new: true }
      );
      saved[key] = normalizedValue;
    }
    
    return NextResponse.json({ success: true, message: 'Settings saved successfully', settings: saved });
  } catch (error: any) {
    console.error('Save settings error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save settings' }, { status: 400 });
  }
}
