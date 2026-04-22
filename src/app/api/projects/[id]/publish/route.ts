import { NextRequest, NextResponse } from 'next/server';
import { getProject, saveProject } from '@/lib/projects';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    project.status = 'published';
    project.updated = new Date().toISOString();
    await saveProject(project);

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to publish project' }, { status: 500 });
  }
}
