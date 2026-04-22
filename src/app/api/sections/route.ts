import { NextRequest, NextResponse } from 'next/server';
import { saveSection, getSections } from '@/lib/projects';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    const sections = await getSections(projectId);
    return NextResponse.json(sections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, section } = await request.json();
    if (!projectId || !section) {
      return NextResponse.json({ error: 'projectId and section are required' }, { status: 400 });
    }
    await saveSection(projectId, section);
    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save section' }, { status: 500 });
  }
}
