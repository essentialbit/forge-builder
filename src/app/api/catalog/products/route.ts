import { NextRequest, NextResponse } from 'next/server';
import { listProducts, countProducts, createProduct } from '@/lib/catalog/queries';
import { seedIfEmpty } from '@/lib/catalog/seed';

// Auto-seed on first boot
let seededChecked = false;
function ensureSeeded() {
  if (seededChecked) return;
  try {
    const res = seedIfEmpty();
    if (!res.skipped) console.log(`[catalog] seeded ${res.seeded} products`);
  } catch (e) {
    console.error('[catalog] seed failed:', e);
  }
  seededChecked = true;
}

export async function GET(request: NextRequest) {
  ensureSeeded();
  const { searchParams } = request.nextUrl;
  const params = {
    search: searchParams.get('search') ?? undefined,
    status: (searchParams.get('status') ?? 'all') as 'draft' | 'active' | 'archived' | 'all',
    productType: searchParams.get('type') ?? undefined,
    collectionId: searchParams.get('collectionId') ?? undefined,
    limit: Number(searchParams.get('limit') ?? 50),
    offset: Number(searchParams.get('offset') ?? 0),
    orderBy: (searchParams.get('orderBy') ?? 'newest') as 'newest' | 'title' | 'price-asc' | 'price-desc',
  };
  const items = listProducts(params);
  const total = countProducts(params);
  return NextResponse.json({ items, total, limit: params.limit, offset: params.offset });
}

export async function POST(request: NextRequest) {
  ensureSeeded();
  try {
    const body = await request.json();
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    const product = createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
