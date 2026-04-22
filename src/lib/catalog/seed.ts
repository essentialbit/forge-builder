/**
 * Seed the catalog DB on first run by parsing
 * ~/.openclaw/workspace/forge-jewellery/src/data/productsData.ts
 *
 * Runs idempotently: no-op if `products` table already has rows.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getDb, getSqlite, newId, slugify, schema } from './db';
import { sql } from 'drizzle-orm';

const FORGE_SOURCE =
  '/Users/mastersaifodius/.openclaw/workspace/forge-jewellery/src/data/productsData.ts';

interface RawProduct {
  id: number;
  name: string;
  price: number;
  compare_price?: number | null;
  category: string;
  image: string;
  sku: string;
  materials?: string;
  description?: string;
  tags?: string;
  featured?: boolean;
  stock_qty?: number;
  badge?: string;
}

function extractString(block: string, key: string): string | null {
  const m =
    block.match(new RegExp(`\\b${key}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`)) ||
    block.match(new RegExp(`\\b${key}\\s*:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\"/g, '"').replace(/\\'/g, "'") : null;
}

function extractNumber(block: string, key: string): number | null {
  const m = block.match(new RegExp(`\\b${key}\\s*:\\s*([\\d.]+)`));
  return m ? Number(m[1]) : null;
}

function extractBool(block: string, key: string): boolean | null {
  const m = block.match(new RegExp(`\\b${key}\\s*:\\s*(true|false)`));
  return m ? m[1] === 'true' : null;
}

/**
 * Parse the PRODUCTS const array out of productsData.ts.
 * Finds depth-1 object literals, tolerating nested braces in strings.
 */
function parseForgeProducts(ts: string): RawProduct[] {
  // Match the full declaration, then use the regex end index to locate the opening bracket of the array literal
  const markerRe = /export\s+const\s+PRODUCTS\s*:\s*Product\[\]\s*=\s*\[/;
  const markerMatch = ts.match(markerRe);
  if (!markerMatch || markerMatch.index === undefined) return [];
  // arrayStart = position of the final '[' we just matched (one char before the regex end)
  const arrayStart = markerMatch.index + markerMatch[0].length - 1;

  // Find matching ] at depth 0
  let depth = 0;
  let arrayEnd = arrayStart;
  for (let i = arrayStart; i < ts.length; i++) {
    const c = ts[i];
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  const body = ts.slice(arrayStart + 1, arrayEnd);

  // Split into objects at depth 1 of `{ }`, ignoring string contents.
  const objects: string[] = [];
  let buf: string[] = [];
  let d = 0;
  let inStr: false | '"' | "'" | '`' = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      if (d > 0) buf.push(c);
      if (c === '\\') {
        if (d > 0 && i + 1 < body.length) buf.push(body[i + 1]);
        i++;
        continue;
      }
      if (c === inStr) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = c as '"' | "'" | '`';
      if (d > 0) buf.push(c);
      continue;
    }
    if (c === '{') {
      if (d === 0) buf = [];
      d++;
      buf.push(c);
    } else if (c === '}') {
      buf.push(c);
      d--;
      if (d === 0) objects.push(buf.join(''));
    } else {
      if (d > 0) buf.push(c);
    }
  }

  const out: RawProduct[] = [];
  for (const b of objects) {
    const name = extractString(b, 'name');
    if (!name) continue;
    out.push({
      id: Number(extractNumber(b, 'id') || 0),
      name,
      price: Number(extractNumber(b, 'price') || 0),
      compare_price: extractNumber(b, 'compare_price') ?? null,
      category: extractString(b, 'category') ?? '',
      image: extractString(b, 'img') ?? '',
      sku: extractString(b, 'sku') ?? '',
      materials: extractString(b, 'materials') ?? '',
      description: extractString(b, 'description') ?? '',
      tags: extractString(b, 'tags') ?? '',
      featured: extractBool(b, 'featured') ?? false,
      stock_qty: extractNumber(b, 'stock_qty') ?? 0,
      badge: extractString(b, 'badge') ?? '',
    });
  }
  return out;
}

/** Converts \"…\" fractions etc. Also prepends the Forge CDN if missing. */
function normaliseImage(img: string): string {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `https://forgejewellery.com.au${img.startsWith('/') ? '' : '/'}${img}`;
}

export function seedIfEmpty(): { seeded: number; skipped: boolean } {
  const db = getDb();
  const sqlite = getSqlite();
  const count = sqlite.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number };
  if (count.c > 0) return { seeded: 0, skipped: true };

  if (!fs.existsSync(FORGE_SOURCE)) {
    return { seeded: 0, skipped: true };
  }

  const raw = fs.readFileSync(FORGE_SOURCE, 'utf8');
  const parsed = parseForgeProducts(raw);
  if (parsed.length === 0) return { seeded: 0, skipped: true };

  const now = Date.now();

  // Collections seed: one per unique category
  const categoriesByHandle = new Map<string, string>();
  const collectionIds = new Map<string, string>();
  for (const p of parsed) {
    const handle = slugify(p.category);
    if (!handle) continue;
    if (!categoriesByHandle.has(handle)) {
      categoriesByHandle.set(handle, p.category);
      const cid = newId('col');
      collectionIds.set(handle, cid);
    }
  }

  const insertCollection = sqlite.prepare(`
    INSERT INTO collections (id, handle, title, description, type, rules, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'smart', ?, 'newest', ?, ?)
  `);
  for (const [handle, title] of categoriesByHandle.entries()) {
    const id = collectionIds.get(handle)!;
    const rules = JSON.stringify([{ field: 'product_type', op: 'equals', value: title }]);
    insertCollection.run(
      id,
      handle,
      title.charAt(0).toUpperCase() + title.slice(1),
      '',
      rules,
      now,
      now,
    );
  }

  const insertProduct = sqlite.prepare(`
    INSERT INTO products (
      id, sku, slug, title, description, vendor, product_type, tags,
      status, price, compare_at_price, in_stock, total_inventory,
      featured_image, seo_title, seo_description,
      created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCollectionProduct = sqlite.prepare(`
    INSERT OR IGNORE INTO collection_products (collection_id, product_id, position)
    VALUES (?, ?, ?)
  `);

  let seeded = 0;
  const txn = sqlite.transaction(() => {
    for (const p of parsed) {
      const id = newId('prod');
      const slug = slugify(p.name);
      const image = normaliseImage(p.image);
      const inStock = (p.stock_qty ?? 0) > 0;
      insertProduct.run(
        id,
        p.sku || `FJ-UNK-${p.id}`,
        slug || `product-${p.id}`,
        p.name,
        p.description ?? '',
        'Forge Jewellery',
        p.category,
        p.tags ?? '',
        'active',
        p.price,
        p.compare_price ?? null,
        inStock ? 1 : 0,
        p.stock_qty ?? 0,
        image,
        p.name,
        (p.description ?? '').slice(0, 160),
        now,
        now,
        now,
      );
      const handle = slugify(p.category);
      const cid = collectionIds.get(handle);
      if (cid) insertCollectionProduct.run(cid, id, seeded);
      seeded++;
    }
  });
  txn();

  return { seeded, skipped: false };
}
