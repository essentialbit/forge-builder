/**
 * SQLite connection, schema migration, and singleton accessor.
 * DB file lives on the external drive alongside other app storage.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';

const STORE_ROOT = process.env.FORGE_STORE_ROOT || '/Volumes/Iron 1TBSSD/Apps/ForgeBuilder';
export const CATALOG_DB_PATH = path.join(STORE_ROOT, 'catalog.db');
export const MEDIA_DIR = path.join(STORE_ROOT, 'media');

// Ensure dirs exist
fs.mkdirSync(path.dirname(CATALOG_DB_PATH), { recursive: true });
fs.mkdirSync(MEDIA_DIR, { recursive: true });

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sqlite: Database.Database | null = null;

function connect() {
  if (_db) return { db: _db, sqlite: _sqlite! };
  const sqlite = new Database(CATALOG_DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Run schema in-line (no drizzle-kit push step needed)
  runMigrations(sqlite);

  const db = drizzle(sqlite, { schema });
  _db = db;
  _sqlite = sqlite;
  return { db, sqlite };
}

export function getDb() {
  return connect().db;
}

export function getSqlite() {
  return connect().sqlite;
}

/**
 * Bootstrap tables idempotently. Keeps things simple — no migration history
 * while the schema is green-field. Swap to drizzle-kit once we have real users.
 */
function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      vendor TEXT DEFAULT '',
      product_type TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      price REAL NOT NULL DEFAULT 0,
      compare_at_price REAL,
      in_stock INTEGER NOT NULL DEFAULT 1,
      total_inventory INTEGER NOT NULL DEFAULT 0,
      featured_image TEXT DEFAULT '',
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      published_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
    CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug);
    CREATE INDEX IF NOT EXISTS products_type_idx ON products(product_type);

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      src TEXT NOT NULL,
      alt TEXT DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      width INTEGER,
      height INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images(product_id);

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sku TEXT NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      compare_at_price REAL,
      inventory_quantity INTEGER NOT NULL DEFAULT 0,
      inventory_policy TEXT NOT NULL DEFAULT 'deny',
      option1 TEXT,
      option2 TEXT,
      option3 TEXT,
      weight REAL,
      weight_unit TEXT DEFAULT 'g',
      barcode TEXT,
      image_id TEXT,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS product_variants_sku_idx ON product_variants(sku);

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      handle TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'manual',
      rules TEXT DEFAULT '[]',
      sort_order TEXT NOT NULL DEFAULT 'manual',
      seo_title TEXT DEFAULT '',
      seo_description TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS collections_handle_idx ON collections(handle);

    CREATE TABLE IF NOT EXISTS collection_products (
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS collection_products_product_idx ON collection_products(product_id);

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      alt TEXT DEFAULT '',
      path TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      stripe_session_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      subtotal REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      customer_name TEXT DEFAULT '',
      customer_email TEXT DEFAULT '',
      shipping_address_json TEXT DEFAULT '{}',
      items_json TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders(stripe_session_id);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'editor',
      password_hash TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expires INTEGER,
      last_login INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
  `);
}

export { schema };

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
