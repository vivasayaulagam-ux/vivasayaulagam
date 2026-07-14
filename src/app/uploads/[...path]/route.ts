import { promises as fs } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    
    // Prevent directory traversal by sanitizing path segments
    if (!path || path.length === 0 || path.some(segment => segment.includes('/') || segment.includes('\\') || segment === '..' || segment === '.')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, ...path);

    try {
      const fileBuffer = await fs.readFile(filePath);
      
      const filename = path[path.length - 1];
      const ext = filename.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === 'webp') contentType = 'image/webp';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'gif') contentType = 'image/gif';
      else if (ext === 'svg') contentType = 'image/svg+xml';
      else if (ext === 'avif') contentType = 'image/avif';
      else if (ext === 'pdf') contentType = 'application/pdf';

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err) {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
