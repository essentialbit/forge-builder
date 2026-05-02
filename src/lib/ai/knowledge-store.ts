/**
 * Forge Builder — AI Knowledge Store
 *
 * Persists learned knowledge in SQLite so it survives restarts and
 * accumulates over time. Knowledge items are injected into the AI's
 * context window at chat time, making it smarter with every session.
 *
 * Sources:
 *   - Web research (fetched when online, summarized by Ollama)
 *   - User corrections ("actually, do it this way")
 *   - Builder event patterns (what sections users add together most)
 *   - External best-practice feeds (schema.org, web.dev, etc.)
 *
 * Security: all fetched content is sanitized before storage. URLs are
 * allow-listed to trusted domains only.
 */

import path from 'node:path';
import fs from 'node:fs';

const STORE_ROOT = process.env.FORGE_STORE_ROOT || '/Volumes/Iron 1TBSSD/Apps/ForgeBuilder';
const AI_DB_PATH = path.join(STORE_ROOT, 'ai-knowledge.db');

export type KnowledgeCategory =
  | 'ecommerce-best-practice'
  | 'jewellery-domain'
  | 'seo-strategy'
  | 'conversion-optimisation'
  | 'accessibility'
  | 'performance'
  | 'security'
  | 'web-dev'
  | 'user-correction'
  | 'builder-pattern';

export interface KnowledgeItem {
  id: number;
  category: KnowledgeCategory;
  title: string;
  content: string;               // Summarised knowledge (max 500 chars)
  source_url?: string;
  confidence: number;            // 0.0 – 1.0
  created_at: number;
  last_seen_at: number;
  use_count: number;
}

let _sqlite: import('better-sqlite3').Database | null = null;

function getDB(): import('better-sqlite3').Database {
  if (_sqlite) return _sqlite;
  fs.mkdirSync(STORE_ROOT, { recursive: true });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(AI_DB_PATH) as import('better-sqlite3').Database;
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category    TEXT    NOT NULL,
      title       TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      source_url  TEXT,
      confidence  REAL    NOT NULL DEFAULT 0.8,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      last_seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
      use_count   INTEGER NOT NULL DEFAULT 0,
      UNIQUE(title, category)
    );

    CREATE TABLE IF NOT EXISTS learn_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      url        TEXT    NOT NULL,
      status     TEXT    NOT NULL,   -- 'ok' | 'failed' | 'skipped'
      fetched_at INTEGER NOT NULL DEFAULT (unixepoch()),
      item_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS builder_patterns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      page_type   TEXT    NOT NULL,  -- 'home' | 'collection' | 'product' | 'other'
      section_seq TEXT    NOT NULL,  -- JSON array of section types
      frequency   INTEGER NOT NULL DEFAULT 1,
      last_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
      UNIQUE(page_type, section_seq)
    );
  `);

  _sqlite = db;
  return db;
}

// ── Knowledge CRUD ──────────────────────────────────────────────────────────

export function upsertKnowledge(items: Omit<KnowledgeItem, 'id' | 'created_at' | 'last_seen_at' | 'use_count'>[]): void {
  const db = getDB();
  const now = Math.floor(Date.now() / 1000);
  const stmt = db.prepare(`
    INSERT INTO knowledge (category, title, content, source_url, confidence, created_at, last_seen_at, use_count)
    VALUES (@category, @title, @content, @source_url, @confidence, @now, @now, 0)
    ON CONFLICT(title, category) DO UPDATE SET
      content      = excluded.content,
      confidence   = excluded.confidence,
      last_seen_at = @now
  `);
  const tx = db.transaction(() => {
    for (const item of items) {
      stmt.run({ ...item, now });
    }
  });
  tx();
}

export function getRelevantKnowledge(
  query: string,
  categories?: KnowledgeCategory[],
  limit = 8
): KnowledgeItem[] {
  const db = getDB();
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (queryWords.length === 0) return getTopKnowledge(limit);

  // Simple keyword search — good enough for local scale
  const likeExpr = queryWords.slice(0, 5).map(() => `(title LIKE ? OR content LIKE ?)`).join(' OR ');
  const params: string[] = queryWords.slice(0, 5).flatMap((w) => [`%${w}%`, `%${w}%`]);

  let sql = `
    SELECT * FROM knowledge
    WHERE (${likeExpr})
    ${categories?.length ? `AND category IN (${categories.map(() => '?').join(',')})` : ''}
    ORDER BY confidence DESC, use_count DESC, last_seen_at DESC
    LIMIT ?
  `;
  const allParams = [...params, ...(categories ?? []), limit];

  try {
    const rows = db.prepare(sql).all(...allParams) as KnowledgeItem[];
    // Increment use_count for returned items
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id).join(',');
      db.exec(`UPDATE knowledge SET use_count = use_count + 1 WHERE id IN (${ids})`);
    }
    return rows;
  } catch {
    return [];
  }
}

export function getTopKnowledge(limit = 8): KnowledgeItem[] {
  try {
    return getDB()
      .prepare(`SELECT * FROM knowledge ORDER BY confidence DESC, use_count DESC LIMIT ?`)
      .all(limit) as KnowledgeItem[];
  } catch {
    return [];
  }
}

export function addUserCorrection(title: string, content: string): void {
  upsertKnowledge([{ category: 'user-correction', title, content, confidence: 1.0 }]);
}

// ── Builder pattern tracking ─────────────────────────────────────────────────

export function recordBuilderPattern(pageType: string, sectionTypes: string[]): void {
  if (sectionTypes.length === 0) return;
  try {
    const db = getDB();
    const seq = JSON.stringify(sectionTypes);
    db.prepare(`
      INSERT INTO builder_patterns (page_type, section_seq, frequency, last_seen)
      VALUES (?, ?, 1, unixepoch())
      ON CONFLICT(page_type, section_seq) DO UPDATE SET
        frequency = frequency + 1,
        last_seen = unixepoch()
    `).run(pageType, seq);
  } catch { /* non-critical */ }
}

export function getTopBuilderPatterns(pageType?: string, limit = 5): Array<{ page_type: string; section_seq: string[]; frequency: number }> {
  try {
    const db = getDB();
    const rows = db.prepare(`
      SELECT page_type, section_seq, frequency FROM builder_patterns
      ${pageType ? 'WHERE page_type = ?' : ''}
      ORDER BY frequency DESC LIMIT ?
    `).all(...(pageType ? [pageType, limit] : [limit])) as Array<{ page_type: string; section_seq: string; frequency: number }>;
    return rows.map((r) => ({ ...r, section_seq: JSON.parse(r.section_seq) as string[] }));
  } catch {
    return [];
  }
}

// ── Learn log ────────────────────────────────────────────────────────────────

export function logLearnAttempt(url: string, status: 'ok' | 'failed' | 'skipped', itemCount = 0): void {
  try {
    getDB().prepare(`
      INSERT INTO learn_log (url, status, item_count) VALUES (?, ?, ?)
    `).run(url, status, itemCount);
  } catch { /* non-critical */ }
}

export function getLearnLog(limit = 20): Array<{ url: string; status: string; fetched_at: number; item_count: number }> {
  try {
    return getDB()
      .prepare(`SELECT url, status, fetched_at, item_count FROM learn_log ORDER BY fetched_at DESC LIMIT ?`)
      .all(limit) as Array<{ url: string; status: string; fetched_at: number; item_count: number }>;
  } catch {
    return [];
  }
}

export function wasRecentlyFetched(url: string, withinHours = 24): boolean {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - withinHours * 3600;
    const row = getDB()
      .prepare(`SELECT id FROM learn_log WHERE url = ? AND status = 'ok' AND fetched_at > ? LIMIT 1`)
      .get(url, cutoff);
    return !!row;
  } catch {
    return false;
  }
}

/** Compact summary of the knowledge base for injection into system prompt */
export function getKnowledgeSummary(query: string): string {
  const items = getRelevantKnowledge(query, undefined, 6);
  if (items.length === 0) return '';
  const lines = items.map((k) => `• [${k.category}] ${k.title}: ${k.content}`);
  return `\n\n--- LEARNED KNOWLEDGE (${items.length} items) ---\n${lines.join('\n')}\n---`;
}
