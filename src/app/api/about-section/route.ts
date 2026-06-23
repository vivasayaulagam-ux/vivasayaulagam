import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AboutSection from '@/models/AboutSection';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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

    const activeCards = (doc.trustCards || [])
      .filter((card: any) => card.isActive)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const normalizedData = {
      smallLabel: doc.smallLabel,
      small_label: doc.smallLabel,
      mainHeading: doc.mainHeading,
      main_heading: doc.mainHeading,
      paragraph1: doc.paragraph1,
      paragraph_1: doc.paragraph1,
      paragraph2: doc.paragraph2,
      paragraph_2: doc.paragraph2,
      quoteText: doc.quoteText,
      quote_text: doc.quoteText,
      mainImage: doc.mainImage,
      main_image: doc.mainImage,
      ctaButtonText: doc.ctaButtonText,
      cta_button_text: doc.ctaButtonText,
      ctaButtonLink: doc.ctaButtonLink,
      cta_button_link: doc.ctaButtonLink,
      trustCards: activeCards
    };

    return NextResponse.json({ success: true, data: normalizedData });
  } catch (error: any) {
    console.error('Error fetching about section:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch about section content' }, { status: 500 });
  }
}
