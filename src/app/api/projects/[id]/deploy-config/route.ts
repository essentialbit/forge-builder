import { NextRequest, NextResponse } from 'next/server';
import { getProject, saveProject } from '@/lib/projects';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const cfg = (project as unknown as Record<string, unknown>).deployConfig ?? {};
    return NextResponse.json(cfg);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    (project as unknown as Record<string, unknown>).deployConfig = {
      githubRepo: body.githubRepo ?? undefined,
      githubBranch: body.githubBranch ?? undefined,
      netlifySiteId: body.netlifySiteId ?? undefined,
      customDomain: body.customDomain ?? undefined,
    };
    project.updated = new Date().toISOString();
    await saveProject(project);
    return NextResponse.json((project as unknown as Record<string, unknown>).deployConfig);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
