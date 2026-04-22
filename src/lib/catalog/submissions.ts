/**
 * Form submissions stored in SQLite alongside the catalog.
 * Simple schema: id, type (newsletter|contact|…), payload JSON, ip, ua, createdAt.
 */
import { getSqlite, newId } from './db';

let tableReady = false;
function ensureTable() {
  if (tableReady) return;
  const sqlite = getSqlite();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS form_submissions_type_idx ON form_submissions(type);
  `);
  tableReady = true;
}

export function recordSubmission(type: string, payload: unknown, ip?: string, userAgent?: string) {
  ensureTable();
  const sqlite = getSqlite();
  const id = newId('sub');
  sqlite
    .prepare(
      `INSERT INTO form_submissions (id, type, payload, ip, user_agent) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, type, JSON.stringify(payload), ip ?? null, userAgent ?? null);
  return id;
}

export function listSubmissions(type?: string, limit = 200) {
  ensureTable();
  const sqlite = getSqlite();
  if (type) {
    return sqlite
      .prepare(`SELECT * FROM form_submissions WHERE type = ? ORDER BY created_at DESC LIMIT ?`)
      .all(type, limit);
  }
  return sqlite
    .prepare(`SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
}
