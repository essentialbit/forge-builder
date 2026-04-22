import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Serves files from projects/<id>/export/ so users can preview the
 * static build exactly as it will be deployed.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; path: string[] }> },
) {
  try {
    const { id, path: parts } = await params;
    const rel = (parts && parts.length > 0 ? parts.join('/') : 'index.html').replace(/\.\./g, '');
    const full = path.join(process.cwd(), 'projects', id, 'export', rel);

    // Prevent path traversal
    const exportRoot = path.join(process.cwd(), 'projects', id, 'export');
    if (!full.startsWith(exportRoot)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const ext = path.extname(full).toLowerCase();
    const content = await fs.readFile(full);
    return new NextResponse(new Uint8Array(content), {
      status: 200,
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('ENOENT')) {
      return new NextResponse('Not built yet. POST /api/projects/:id/preview-build first.', { status: 404 });
    }
    return new NextResponse(msg, { status: 500 });
  }
}
