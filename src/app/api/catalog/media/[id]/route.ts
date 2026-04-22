import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { MEDIA_DIR } from '@/lib/catalog/db';
import { getMediaById } from '@/lib/catalog/queries';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getMediaById(id);
  if (!m) return new NextResponse('Not found', { status: 404 });
  const file = path.join(MEDIA_DIR, m.path);
  try {
    const data = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': MIME[ext] ?? m.mimeType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
