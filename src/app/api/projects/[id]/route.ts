import { NextRequest, NextResponse } from 'next/server';
import { getProject, saveProject, getSections } from '@/lib/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Attach sections to pages
    const sections = await getSections(id);
    const sectionsMap = new Map(sections.map((s) => [s.id, s]));

    // Return sections as a map keyed by id (client expects Record<string, Section>)
    const sectionsDict: Record<string, unknown> = {};
    for (const s of sections) {
      sectionsDict[s.id] = s;
    }
    const projectWithSections = {
      ...project,
      sections: sectionsDict,
    };

    return NextResponse.json(projectWithSections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await request.json();
    await saveProject(project);
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}
