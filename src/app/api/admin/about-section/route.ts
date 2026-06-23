import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import dbConnect from '@/lib/db';
import AboutSection from '@/models/AboutSection';

export const dynamic = 'force-dynamic';

export async function GET() {
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
    let doc = await AboutSection.findOne().lean();

    if (!doc) {
      const defaultDoc = {
        smallLabel: 'ABOUT VIVASAYA ULAGAM',
        mainHeading: 'Rooted in Tradition. Delivered with Trust.',
        paragraph1: 'At Vivasaya Ulagam, we bring traditional South Indian food products, natural essentials, herbal powders, sweets, snacks, pickles, and everyday grocery items directly to your home. Our mission is simple — to make authentic, natural, and trusted food products easily available for every family.',
        paragraph2: 'Rooted in the rich agricultural heritage of Tamil Nadu, we focus on products that carry the taste of tradition, homemade quality, and natural goodness. From Ellu Urundai, Rava Laddu, Sathu Maavu, Herbal Powders, Pickles, and Combo Packs, every product is selected with care to give customers better quality and better value.',
        quoteText: 'We believe food is not just a product — it is tradition, health, and trust packed together.',
        mainImage: '/about-us.png',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/shop',
        trustCards: [
          {
            icon: 'leaf',
            title: '100% Natural Products',
            description: 'Carefully selected products made with natural ingredients.',
            isActive: true,
            sortOrder: 1
          },
          {
            icon: 'shirt',
            title: 'Traditional Taste',
            description: 'Authentic South Indian flavours inspired by homemade recipes.',
            isActive: true,
            sortOrder: 2
          },
          {
            icon: 'truck',
            title: 'All India Shipping',
            description: 'We deliver Vivasaya Ulagam products across India.',
            isActive: true,
            sortOrder: 3
          },
          {
            icon: 'shield',
            title: 'Secure Checkout',
            description: 'Safe and simple payment experience with trusted payment options.',
            isActive: true,
            sortOrder: 4
          }
        ],
        isActive: true
      };

      doc = await AboutSection.create(defaultDoc);
    }

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    console.error('Error fetching admin about section:', error);
    return NextResponse.json({ error: 'Failed to fetch about section settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message || 'Unauthorized' },
        { status: authError.status || 401 }
      );
    }

    const body = await req.json();
    const {
      smallLabel,
      mainHeading,
      paragraph1,
      paragraph2,
      quoteText,
      mainImage,
      ctaButtonText,
      ctaButtonLink,
      trustCards,
      isActive
    } = body;

    // Field Validations
    if (!smallLabel || !smallLabel.trim()) {
      return NextResponse.json({ error: 'Small label is required' }, { status: 400 });
    }
    if (!mainHeading || !mainHeading.trim()) {
      return NextResponse.json({ error: 'Main heading is required' }, { status: 400 });
    }
    if (!paragraph1 || !paragraph1.trim()) {
      return NextResponse.json({ error: 'Paragraph 1 is required' }, { status: 400 });
    }
    if (!mainImage || !mainImage.trim()) {
      return NextResponse.json({ error: 'Main image is required' }, { status: 400 });
    }
    if (!ctaButtonText || !ctaButtonText.trim()) {
      return NextResponse.json({ error: 'CTA button text is required' }, { status: 400 });
    }
    if (!ctaButtonLink || !ctaButtonLink.trim()) {
      return NextResponse.json({ error: 'CTA button link is required' }, { status: 400 });
    }

    // Trust cards validation: at least 1 active card
    if (!Array.isArray(trustCards) || trustCards.length === 0) {
      return NextResponse.json({ error: 'At least one trust card is required' }, { status: 400 });
    }
    const hasActiveCard = trustCards.some((card: any) => card.isActive);
    if (!hasActiveCard) {
      return NextResponse.json({ error: 'Minimum 1 active card required' }, { status: 400 });
    }

    await dbConnect();

    // Perform update or upsert
    const doc = await AboutSection.findOneAndUpdate(
      {},
      {
        smallLabel,
        mainHeading,
        paragraph1,
        paragraph2: paragraph2 || '',
        quoteText: quoteText || '',
        mainImage,
        ctaButtonText,
        ctaButtonLink,
        trustCards: trustCards.map((card: any, idx: number) => ({
          icon: card.icon,
          title: card.title,
          description: card.description || '',
          isActive: !!card.isActive,
          sortOrder: typeof card.sortOrder === 'number' ? card.sortOrder : idx + 1
        })),
        isActive: isActive !== false
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: 'About section updated successfully', data: doc });
  } catch (error: any) {
    console.error('Error saving admin about section:', error);
    return NextResponse.json({ error: 'Failed to save about section settings' }, { status: 500 });
  }
}
