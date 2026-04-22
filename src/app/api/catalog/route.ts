/**
 * Legacy endpoint returning the shape expected by SectionRenderer / publish renderer.
 * Sources data from the SQLite catalog (with auto-seed fallback).
 */
import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/catalog/queries';
import { seedIfEmpty } from '@/lib/catalog/seed';

let seeded = false;
function ensureSeeded() {
  if (seeded) return;
  try {
    const r = seedIfEmpty();
    if (!r.skipped) console.log(`[catalog] seeded ${r.seeded} products`);
  } catch (e) {
    console.error('[catalog] seed failed', e);
  }
  seeded = true;
}

export async function GET() {
  ensureSeeded();
  const items = listProducts({ status: 'active', limit: 500 });
  const categories = Array.from(new Set(items.map((p) => p.productType).filter(Boolean))).sort();
  // Map DB shape → legacy shape the builder renderer expects
  const products = items.map((p) => ({
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.title,
    price: p.price,
    compare_price: p.compareAtPrice,
    category: p.productType,
    image: p.featuredImage,
    materials: '',
  }));
  return NextResponse.json({ products, categories });
}
