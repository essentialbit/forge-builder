/**
 * Auth.js v5 (next-auth@beta) catch-all route handler.
 *
 * Handles all OAuth/OIDC flows:
 *   GET  /api/auth/signin         → Sign-in page redirect
 *   GET  /api/auth/callback/*     → OAuth callback
 *   GET  /api/auth/signout        → Sign out
 *   GET  /api/auth/session        → Current session
 *   GET  /api/auth/csrf           → CSRF token
 *   GET  /api/auth/providers      → Available providers
 */

import { handlers } from '@/lib/auth/oidc';

export const { GET, POST } = handlers;
