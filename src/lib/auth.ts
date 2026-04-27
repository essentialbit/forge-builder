/**
 * Client-safe auth helpers. Safe to import in both server and client components.
 * Never import auth-server.ts from client components.
 */

export interface ForgeUser {
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

export async function signInWithEmail(email: string, password: string): Promise<ForgeUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.redirect) {
      window.location.href = data.redirect;
    }
    throw new Error(data.error ?? 'Sign-in failed');
  }
  return data.user as ForgeUser;
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
  document.cookie = 'forge-user=; path=/; max-age=0';
}

export function getCurrentUserFromCookie(): ForgeUser | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)forge-user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as ForgeUser;
  } catch {
    return null;
  }
}
