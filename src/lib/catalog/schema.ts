/**
 * Catalog DB schema (SQLite via Drizzle).
 *
 * Storage location:
 *   /Volumes/Iron 1TBSSD/Apps/ForgeBuilder/catalog.db  (see ./db.ts)
 *
 * Designed to be Postgres-migratable. Avoid SQLite-specific types.
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/* =============================================================
 * Products
 * ============================================================= */
export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(), // e.g. "prod_xyz"
    sku: text('sku').notNull().unique(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').default(''), // HTML (Tiptap output)
    vendor: text('vendor').default(''),
    productType: text('product_type').default(''),
    tags: text('tags').default(''), // comma-separated
    status: text('status', { enum: ['draft', 'active', 'archived'] })
      .notNull()
      .default('draft'),

    // Basic pricing (for products without variants or default variant)
    price: real('price').notNull().default(0),
    compareAtPrice: real('compare_at_price'),

    // Inventory summary (denormalized from variants for quick listing)
    inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
    totalInventory: integer('total_inventory').notNull().default(0),

    // Media (primary image; extras in product_images)
    featuredImage: text('featured_image').default(''),

    // SEO
    seoTitle: text('seo_title').default(''),
    seoDescription: text('seo_description').default(''),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    statusIdx: index('products_status_idx').on(t.status),
    slugIdx: index('products_slug_idx').on(t.slug),
    typeIdx: index('products_type_idx').on(t.productType),
  }),
);

/* =============================================================
 * Product Images
 * ============================================================= */
export const productImages = sqliteTable(
  'product_images',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    src: text('src').notNull(), // filesystem path or URL
    alt: text('alt').default(''),
    position: integer('position').notNull().default(0),
    width: integer('width'),
    height: integer('height'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    productIdx: index('product_images_product_idx').on(t.productId),
  }),
);

/* =============================================================
 * Product Variants
 * ============================================================= */
export const productVariants = sqliteTable(
  'product_variants',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    title: text('title').notNull(), // e.g. "Gold / 18""
    price: real('price').notNull().default(0),
    compareAtPrice: real('compare_at_price'),
    inventoryQuantity: integer('inventory_quantity').notNull().default(0),
    inventoryPolicy: text('inventory_policy', {
      enum: ['deny', 'continue'],
    })
      .notNull()
      .default('deny'),
    option1: text('option1'),
    option2: text('option2'),
    option3: text('option3'),
    weight: real('weight'),
    weightUnit: text('weight_unit').default('g'),
    barcode: text('barcode'),
    imageId: text('image_id'),
    position: integer('position').notNull().default(0),
  },
  (t) => ({
    productIdx: index('product_variants_product_idx').on(t.productId),
    skuIdx: index('product_variants_sku_idx').on(t.sku),
  }),
);

/* =============================================================
 * Collections
 * ============================================================= */
export const collections = sqliteTable(
  'collections',
  {
    id: text('id').primaryKey(),
    handle: text('handle').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').default(''),
    image: text('image').default(''),
    type: text('type', { enum: ['manual', 'smart'] })
      .notNull()
      .default('manual'),
    // Smart collection rules as JSON:
    // [{ field: "category", op: "equals", value: "necklaces" }, ...]
    rules: text('rules').default('[]'),
    sortOrder: text('sort_order', {
      enum: ['manual', 'best-selling', 'price-asc', 'price-desc', 'title-asc', 'title-desc', 'newest'],
    })
      .notNull()
      .default('manual'),
    seoTitle: text('seo_title').default(''),
    seoDescription: text('seo_description').default(''),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    handleIdx: index('collections_handle_idx').on(t.handle),
  }),
);

/* =============================================================
 * Collection <-> Product (manual membership + sort order override)
 * ============================================================= */
export const collectionProducts = sqliteTable(
  'collection_products',
  {
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => ({
    pk: index('collection_products_pk').on(t.collectionId, t.productId),
    productIdx: index('collection_products_product_idx').on(t.productId),
  }),
);

/* =============================================================
 * Media (general asset library — not only product images)
 * ============================================================= */
export const media = sqliteTable(
  'media',
  {
    id: text('id').primaryKey(),
    filename: text('filename').notNull(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    alt: text('alt').default(''),
    // Storage path on disk, relative to the media root
    path: text('path').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
);

/* =============================================================
 * Users (auth)
 * ============================================================= */
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull().default(''),
    role: text('role', { enum: ['admin', 'editor'] }).notNull().default('editor'),
    passwordHash: text('password_hash').notNull(),
    resetToken: text('reset_token'),
    resetTokenExpires: integer('reset_token_expires', { mode: 'timestamp_ms' }),
    lastLogin: integer('last_login', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    emailIdx: index('users_email_idx').on(t.email),
  }),
);

/* =============================================================
 * Types
 * ============================================================= */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
