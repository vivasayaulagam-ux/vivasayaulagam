import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(bytes);

    // Set up path to public/uploads/
    const isCompressibleImage = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type);
    const originalStem = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sanitizedFilename = isCompressibleImage
      ? `${Date.now()}-${originalStem}.webp`
      : `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, sanitizedFilename);
    if (isCompressibleImage) {
      buffer = await sharp(buffer)
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toBuffer();
    }
    await writeFile(filePath, buffer);
    
    // Return relative url path
    const fileUrl = `/uploads/${sanitizedFilename}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
