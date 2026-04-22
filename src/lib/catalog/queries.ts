/**
 * High-level catalog data access used by API routes + SSR.
 */

import { getDb, getSqlite, newId, slugify, schema } from './db';
import { and, desc, eq, like, or, sql, inArray } from 'drizzle-orm';

const { products, productImages, productVariants, collections, collectionProducts, media } = schema;

/* =============================================================
 * Products
 * ============================================================= */
export interface ListProductsParams {
  search?: string;
  status?: 'draft' | 'active' | 'archived' | 'all';
  productType?: string;
  collectionId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'newest' | 'title' | 'price-asc' | 'price-desc';
}

export function listProducts(params: ListProductsParams = {}) {
  const db = getDb();
  const { search, status = 'all', productType, collectionId, limit = 50, offset = 0, orderBy = 'newest' } = params;

  const filters = [] as unknown[];
  if (status !== 'all') filters.push(eq(products.status, status));
  if (productType) filters.push(eq(products.productType, productType));
  if (search) {
    const q = `%${search.toLowerCase()}%`;
    filters.push(or(like(sql`lower(${products.title})`, q), like(sql`lower(${products.sku})`, q)));
  }

  let base;
  if (collectionId) {
    base = db
      .select({ products })
      .from(products)
      .innerJoin(collectionProducts, eq(collectionProducts.productId, products.id))
      .where(and(eq(collectionProducts.collectionId, collectionId), ...(filters as never[])));
  } else {
    base = db.select({ products }).from(products).where(filters.length ? and(...(filters as never[])) : undefined);
  }

  const order =
    orderBy === 'title'
      ? products.title
      : orderBy === 'price-asc'
        ? products.price
        : orderBy === 'price-desc'
          ? desc(products.price)
          : desc(products.createdAt);

  const rows = base.orderBy(order).limit(limit).offset(offset).all() as Array<{ products: typeof products.$inferSelect }>;
  return rows.map((r) => r.products);
}

export function countProducts(params: ListProductsParams = {}) {
  const sqlite = getSqlite();
  const { status = 'all', productType, search } = params;
  const conds: string[] = [];
  const args: unknown[] = [];
  if (status !== 'all') {
    conds.push('status = ?');
    args.push(status);
  }
  if (productType) {
    conds.push('product_type = ?');
    args.push(productType);
  }
  if (search) {
    conds.push('(lower(title) LIKE ? OR lower(sku) LIKE ?)');
    args.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const r = sqlite.prepare(`SELECT COUNT(*) AS c FROM products ${where}`).get(...args) as { c: number };
  return r.c;
}

export function getProductById(id: string) {
  const db = getDb();
  const row = db.select().from(products).where(eq(products.id, id)).get();
  if (!row) return null;
  const images = db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.position).all();
  const variants = db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(productVariants.position).all();
  return { ...row, images, variants };
}

export function getProductBySlug(slug: string) {
  const db = getDb();
  const row = db.select().from(products).where(eq(products.slug, slug)).get();
  if (!row) return null;
  return getProductById(row.id);
}

export function createProduct(input: Partial<typeof products.$inferInsert> & { title: string }) {
  const db = getDb();
  const id = newId('prod');
  const slug = (input.slug ?? slugify(input.title)) || `product-${Date.now()}`;
  const sku = input.sku ?? `SKU-${id.slice(-6).toUpperCase()}`;
  const now = Date.now();

  db.insert(products)
    .values({
      id,
      sku,
      slug,
      title: input.title,
      description: input.description ?? '',
      vendor: input.vendor ?? '',
      productType: input.productType ?? '',
      tags: input.tags ?? '',
      status: (input.status ?? 'draft') as 'draft' | 'active' | 'archived',
      price: input.price ?? 0,
      compareAtPrice: input.compareAtPrice ?? null,
      inStock: input.inStock ?? true,
      totalInventory: input.totalInventory ?? 0,
      featuredImage: input.featuredImage ?? '',
      seoTitle: input.seoTitle ?? '',
      seoDescription: input.seoDescription ?? '',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    })
    .run();
  return getProductById(id)!;
}

export function updateProduct(id: string, patch: Partial<typeof products.$inferInsert>) {
  const db = getDb();
  const now = Date.now();
  const allowed: (keyof typeof products.$inferInsert)[] = [
    'sku',
    'slug',
    'title',
    'description',
    'vendor',
    'productType',
    'tags',
    'status',
    'price',
    'compareAtPrice',
    'inStock',
    'totalInventory',
    'featuredImage',
    'seoTitle',
    'seoDescription',
  ];
  const values: Record<string, unknown> = { updatedAt: new Date(now) };
  for (const k of allowed) {
    if (k in patch) values[k] = (patch as Record<string, unknown>)[k];
  }
  db.update(products).set(values).where(eq(products.id, id)).run();
  return getProductById(id);
}

export function deleteProduct(id: string) {
  const db = getDb();
  db.delete(products).where(eq(products.id, id)).run();
}

/* =============================================================
 * Images
 * ============================================================= */
export function addProductImage(productId: string, src: string, alt = '', position = 0) {
  const db = getDb();
  const id = newId('img');
  db.insert(productImages)
    .values({ id, productId, src, alt, position, createdAt: new Date() })
    .run();
  return id;
}

export function setFeaturedImage(productId: string, src: string) {
  return updateProduct(productId, { featuredImage: src });
}

/* =============================================================
 * Collections
 * ============================================================= */
export function listCollections() {
  const db = getDb();
  return db.select().from(collections).orderBy(collections.title).all();
}

export function getCollectionByHandle(handle: string) {
  const db = getDb();
  const col = db.select().from(collections).where(eq(collections.handle, handle)).get();
  if (!col) return null;
  return col;
}

export function productsInCollection(collectionId: string) {
  const db = getDb();
  // Get collection to determine smart vs manual
  const col = db.select().from(collections).where(eq(collections.id, collectionId)).get();
  if (!col) return [];

  if (col.type === 'manual') {
    const links = db
      .select({ productId: collectionProducts.productId, position: collectionProducts.position })
      .from(collectionProducts)
      .where(eq(collectionProducts.collectionId, collectionId))
      .orderBy(collectionProducts.position)
      .all();
    if (links.length === 0) return [];
    const ids = links.map((l) => l.productId);
    const prods = db.select().from(products).where(inArray(products.id, ids)).all();
    const byId = new Map(prods.map((p) => [p.id, p] as const));
    return links.map((l) => byId.get(l.productId)).filter(Boolean);
  }

  // Smart: parse rules JSON and apply (only simple equals on product_type for now)
  let rules: Array<{ field: string; op: string; value: string }> = [];
  try {
    rules = JSON.parse(col.rules || '[]');
  } catch {}
  const typeRule = rules.find((r) => r.field === 'product_type' && r.op === 'equals');
  if (typeRule) {
    return db.select().from(products).where(eq(products.productType, typeRule.value)).orderBy(products.title).all();
  }
  return db.select().from(products).limit(50).all();
}

export function createCollection(title: string, opts: Partial<typeof collections.$inferInsert> = {}) {
  const db = getDb();
  const id = newId('col');
  const handle = (opts.handle ?? slugify(title)) || `collection-${Date.now()}`;
  const now = new Date();
  db.insert(collections)
    .values({
      id,
      handle,
      title,
      description: opts.description ?? '',
      image: opts.image ?? '',
      type: (opts.type ?? 'manual') as 'manual' | 'smart',
      rules: opts.rules ?? '[]',
      sortOrder: (opts.sortOrder ?? 'manual') as never,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return db.select().from(collections).where(eq(collections.id, id)).get();
}

/* =============================================================
 * Media
 * ============================================================= */
export function recordMedia(entry: typeof media.$inferInsert) {
  const db = getDb();
  db.insert(media).values(entry).run();
  return entry;
}

export function listMedia(limit = 100) {
  const db = getDb();
  return db.select().from(media).orderBy(desc(media.createdAt)).limit(limit).all();
}

export function getMediaById(id: string) {
  const db = getDb();
  return db.select().from(media).where(eq(media.id, id)).get();
}
