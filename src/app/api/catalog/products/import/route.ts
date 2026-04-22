import { NextRequest, NextResponse } from 'next/server';
import { getSqlite, newId, slugify } from '@/lib/catalog/db';
import type { Product } from '@/lib/catalog/schema';

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * CSV import. Accepts either:
 *   POST multipart/form-data with file=<csv>
 *   POST application/json with { csv: "<string>" }
 *
 * Columns (case-insensitive, any order):
 *   sku (required), title (required), slug, description, price, compare_at_price,
 *   product_type, vendor, tags, status, featured_image, total_inventory,
 *   seo_title, seo_description
 *
 * If sku matches an existing row → update. Otherwise → create.
 */
export async function POST(req: NextRequest) {
  try {
    let csvText = '';
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData();
      const file = fd.get('file');
      if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = String(body.csv ?? '');
    }

    if (!csvText.trim()) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });

    const rows = parseCsv(csvText);
    if (rows.length < 2) return NextResponse.json({ error: 'CSV needs a header row plus at least one data row' }, { status: 400 });

    const header = rows[0].map((h) => h.toLowerCase().trim());
    const required = ['sku', 'title'];
    const missing = required.filter((r) => !header.includes(r));
    if (missing.length) {
      return NextResponse.json({ error: `Missing required columns: ${missing.join(', ')}` }, { status: 400 });
    }

    const idx = (name: string) => header.indexOf(name);
    const sqlite = getSqlite();
    const insert = sqlite.prepare(`
      INSERT INTO products (
        id, sku, slug, title, description, vendor, product_type, tags,
        status, price, compare_at_price, in_stock, total_inventory,
        featured_image, seo_title, seo_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateBySku = sqlite.prepare(`
      UPDATE products SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        vendor = COALESCE(?, vendor),
        product_type = COALESCE(?, product_type),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        price = COALESCE(?, price),
        compare_at_price = ?,
        total_inventory = COALESCE(?, total_inventory),
        in_stock = COALESCE(?, in_stock),
        featured_image = COALESCE(?, featured_image),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        updated_at = ?
      WHERE sku = ?
    `);
    const findBySku = sqlite.prepare('SELECT id FROM products WHERE sku = ?');

    const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };
    const now = Date.now();

    const txn = sqlite.transaction(() => {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        try {
          const sku = r[idx('sku')]?.trim();
          const title = r[idx('title')]?.trim();
          if (!sku || !title) {
            result.skipped++;
            continue;
          }
          const existing = findBySku.get(sku) as { id: string } | undefined;
          const get = (name: string) => {
            const k = idx(name);
            if (k < 0) return null;
            const v = r[k];
            return v === undefined || v === '' ? null : v;
          };
          const num = (name: string) => {
            const v = get(name);
            if (v === null) return null;
            const n = Number(v);
            return Number.isFinite(n) ? n : null;
          };
          const slug = get('slug') || slugify(title);
          const price = num('price') ?? 0;
          const comparePrice = num('compare_at_price');
          const inv = num('total_inventory') ?? 0;

          if (existing) {
            updateBySku.run(
              title,
              slug,
              get('description'),
              get('vendor'),
              get('product_type'),
              get('tags'),
              get('status') ?? 'active',
              price,
              comparePrice,
              inv,
              inv > 0 ? 1 : 0,
              get('featured_image'),
              get('seo_title'),
              get('seo_description'),
              now,
              sku,
            );
            result.updated++;
          } else {
            insert.run(
              newId('prod'),
              sku,
              slug,
              title,
              get('description') ?? '',
              get('vendor') ?? '',
              get('product_type') ?? '',
              get('tags') ?? '',
              get('status') ?? 'active',
              price,
              comparePrice,
              inv > 0 ? 1 : 0,
              inv,
              get('featured_image') ?? '',
              get('seo_title') ?? '',
              get('seo_description') ?? '',
              now,
              now,
            );
            result.created++;
          }
        } catch (e) {
          result.errors.push({ row: i + 1, message: e instanceof Error ? e.message : String(e) });
        }
      }
    });
    txn();

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/**
 * Minimal CSV parser handling quoted fields with embedded commas and newlines.
 * Enough for well-formed exports from Shopify / Wix / Google Sheets.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"' && field.length === 0) {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++; // \r\n
        row.push(field);
        field = '';
        if (row.length > 0 && row.some((x) => x.length > 0)) rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
