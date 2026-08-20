import { NextRequest, NextResponse } from 'next/server';
import { generateMetaXmlFeed } from '@/lib/shopping/metaFeed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const xml = await generateMetaXmlFeed(req);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Meta feed generation error:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate Meta feed</error>',
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
