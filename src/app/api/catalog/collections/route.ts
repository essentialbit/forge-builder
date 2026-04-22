import { NextRequest, NextResponse } from 'next/server';
import { listCollections, createCollection, productsInCollection } from '@/lib/catalog/queries';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const items = productsInCollection(id);
    return NextResponse.json({ items });
  }
  return NextResponse.json(listCollections());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    const col = createCollection(body.title, body);
    return NextResponse.json(col, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
