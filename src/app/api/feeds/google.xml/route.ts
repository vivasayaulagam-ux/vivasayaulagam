import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleXmlFeed } from '@/lib/shopping/googleFeed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const xml = await generateGoogleXmlFeed(req);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Google Merchant feed generation error:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate Google Merchant feed</error>',
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
