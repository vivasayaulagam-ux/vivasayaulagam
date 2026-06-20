import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Video from '@/models/Video';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

const DEFAULT_REELS = [
  {
    title: "Millet Semiya Starter Pack",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-chef-cooking-noodles-in-a-pan-40613-large.mp4",
    img: "/uploads/products/sweets_snacks_thumb.png",
    instagramId: "reel_1",
  },
  {
    title: "Finger Millet Noodles",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fresh-milk-poured-into-a-glass-41714-large.mp4",
    img: "/uploads/products/rice_powders_thumb.png",
    instagramId: "reel_2",
  },
  {
    title: "Peanut Butter Process",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-honey-from-a-wooden-spoon-41712-large.mp4",
    img: "/uploads/products/health_dairy_thumb.png",
    instagramId: "reel_3",
  },
  {
    title: "Groundnut Oil Extraction",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cooking-italian-pasta-in-boiling-water-40612-large.mp4",
    img: "/uploads/products/masala_spice_powders_thumb.png",
    instagramId: "reel_4",
  },
  {
    title: "Moringa Soup Mix",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-green-tea-leaves-in-a-plantation-42777-large.mp4",
    img: "/uploads/products/hair_skin_care_thumb.png",
    instagramId: "reel_5",
  },
];

export async function GET() {
  try {
    await dbConnect();
    
    let videos = await Video.find({ isActive: { $ne: false } })
      .select('title videoUrl img instagramId taggedProductId price isActive')
      .populate('taggedProductId', 'title images price status')
      .lean();
    
    // Seed default videos if empty
    if (videos.length === 0) {
      const activeProducts = await Product.find({ status: 'active' })
        .select('_id price')
        .limit(5)
        .lean();
      
      const seedData = DEFAULT_REELS.map((item, idx) => {
        const product = activeProducts[idx % activeProducts.length];
        return {
          ...item,
          taggedProductId: product ? product._id : null,
          price: product ? product.price : 150,
          isActive: true
        };
      });
      
      await Video.insertMany(seedData);
      videos = await Video.find({ isActive: { $ne: false } })
        .select('title videoUrl img instagramId taggedProductId price isActive')
        .populate('taggedProductId', 'title images price status')
        .lean();
    }
    
    return NextResponse.json({ success: true, videos }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error: any) {
    console.error('Fetch reels error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch reels' }, { status: 500 });
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

    if (!body.title || !body.videoUrl) {
      return NextResponse.json({ success: false, error: 'Title and Video URL are required' }, { status: 400 });
    }

    const newVideo = await Video.create(body);
    return NextResponse.json({ success: true, video: newVideo }, { status: 201 });
  } catch (error: any) {
    console.error('Create video error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create video' }, { status: 400 });
  }
}
