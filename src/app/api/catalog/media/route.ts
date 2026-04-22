import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { MEDIA_DIR } from '@/lib/catalog/db';
import { recordMedia, listMedia } from '@/lib/catalog/queries';
import { newId } from '@/lib/catalog/db';

export async function GET() {
  return NextResponse.json(listMedia());
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const alt = (formData.get('alt') as string) ?? '';

    const id = newId('media');
    const buf = Buffer.from(await file.arrayBuffer());

    // Normalise to webp + keep original extension as fallback
    const ext = path.extname(file.name || '').toLowerCase() || '.bin';
    const safeExt = /^\.(jpg|jpeg|png|webp|gif|svg)$/.test(ext) ? ext : '.bin';
    const filename = `${id}${safeExt}`;
    const destDir = MEDIA_DIR;
    await fs.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);

    // Get dimensions via sharp if it's an image
    let width: number | undefined;
    let height: number | undefined;
    if (/^image\//.test(file.type) && file.type !== 'image/svg+xml') {
      try {
        const meta = await sharp(buf).metadata();
        width = meta.width ?? undefined;
        height = meta.height ?? undefined;
      } catch {}
    }

    await fs.writeFile(destPath, buf);

    recordMedia({
      id,
      filename,
      originalName: file.name || filename,
      mimeType: file.type || 'application/octet-stream',
      size: buf.length,
      width,
      height,
      alt,
      path: filename, // relative to MEDIA_DIR
      createdAt: new Date(),
    });

    return NextResponse.json({
      id,
      url: `/api/catalog/media/${id}`,
      filename,
      width,
      height,
      size: buf.length,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
