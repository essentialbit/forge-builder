import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/catalog/queries';

/**
 * Export all products as CSV (Shopify-compatible-ish).
 * GET /api/catalog/products/export
 */
export async function GET() {
  const items = listProducts({ status: 'all', limit: 5000 });
  const cols = [
    'sku',
    'title',
    'slug',
    'description',
    'vendor',
    'product_type',
    'tags',
    'status',
    'price',
    'compare_at_price',
    'total_inventory',
    'featured_image',
    'seo_title',
    'seo_description',
  ] as const;
  const esc = (v: unknown) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [cols.join(',')];
  for (const p of items) {
    lines.push(
      [
        p.sku,
        p.title,
        p.slug,
        p.description,
        p.vendor,
        p.productType,
        p.tags,
        p.status,
        p.price,
        p.compareAtPrice ?? '',
        p.totalInventory,
        p.featuredImage,
        p.seoTitle,
        p.seoDescription,
      ]
        .map(esc)
        .join(','),
    );
  }
  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="forge-builder-products-${Date.now()}.csv"`,
    },
  });
}
