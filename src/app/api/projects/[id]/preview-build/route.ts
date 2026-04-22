import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getProject, getSections } from '@/lib/projects';
import { renderSite } from '@/lib/publish/renderer';
import type { Section } from '@/types/builder';

/**
 * Builds the static site in-memory (no git/Netlify) so the user can
 * preview exactly what will be published. Writes to projects/<id>/export/.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const sections = await getSections(id);
    const sectionMap = new Map<string, Section>(sections.map((s) => [s.id, s] as const));
    const rendered = renderSite(project, sectionMap);

    const exportDir = path.join(process.cwd(), 'projects', id, 'export');
    await fs.rm(exportDir, { recursive: true, force: true });
    await fs.mkdir(exportDir, { recursive: true });
    for (const f of rendered.files) {
      const dest = path.join(exportDir, f.path);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, f.content, 'utf8');
    }

    return NextResponse.json({
      ok: true,
      fileCount: rendered.files.length,
      files: rendered.files.map((f) => f.path),
      exportDir,
      previewUrl: `/api/projects/${id}/exported/index.html`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
