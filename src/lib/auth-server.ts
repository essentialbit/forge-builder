/**
 * Server-only auth utilities. Never import this in client components.
 * Uses bcryptjs for password hashing and jose for JWT.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, createHash } from 'node:crypto';
import { getDb, getSqlite, newId } from './catalog/db';
import { users } from './catalog/schema';
import { eq } from 'drizzle-orm';
import type { User } from './catalog/schema';

const SALT_ROUNDS = 12;
const JWT_EXPIRY = '7d';
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

export interface SessionPayload {
  sub: string;   // user id
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(jwtSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// User queries
// ---------------------------------------------------------------------------

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function listUsers(): Promise<Omit<User, 'passwordHash' | 'resetToken' | 'resetTokenExpires'>[]> {
  const db = getDb();
  const all = await db.select().from(users);
  return all.map(({ passwordHash: _ph, resetToken: _rt, resetTokenExpires: _rte, ...safe }) => safe);
}

export async function countUsers(): Promise<number> {
  const sqlite = getSqlite();
  const row = sqlite.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number };
  return row.n;
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'editor' = 'editor',
): Promise<Omit<User, 'passwordHash' | 'resetToken' | 'resetTokenExpires'>> {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const id = newId('usr');
  const now = Date.now();

  await db.insert(users).values({
    id,
    email: email.toLowerCase().trim(),
    name,
    role,
    passwordHash,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });

  const user = await getUserById(id);
  if (!user) throw new Error('Failed to create user');
  const { passwordHash: _ph, resetToken: _rt, resetTokenExpires: _rte, ...safe } = user;
  return safe;
}

export async function updateUser(
  id: string,
  fields: Partial<{ name: string; role: 'admin' | 'editor'; password: string }>,
): Promise<void> {
  const db = getDb();
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.role !== undefined) update.role = fields.role;
  if (fields.password !== undefined) update.passwordHash = await hashPassword(fields.password);
  await db.update(users).set(update).where(eq(users.id, id));
}

export async function deleteUser(id: string): Promise<void> {
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
}

export async function recordLastLogin(id: string): Promise<void> {
  const db = getDb();
  await db.update(users).set({ lastLogin: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export async function generateResetToken(email: string): Promise<{ resetUrl: string } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null; // Don't reveal whether email exists

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  const db = getDb();
  await db.update(users).set({ resetToken: tokenHash, resetTokenExpires: expires, updatedAt: new Date() }).where(eq(users.id, user.id));

  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return { resetUrl: `${base}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}` };
}

export async function consumeResetToken(email: string, rawToken: string, newPassword: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user || !user.resetToken || !user.resetTokenExpires) return false;

  if (user.resetTokenExpires < new Date()) return false;

  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  if (tokenHash !== user.resetToken) return false;

  const db = getDb();
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({
    passwordHash,
    resetToken: null,
    resetTokenExpires: null,
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));

  return true;
}
