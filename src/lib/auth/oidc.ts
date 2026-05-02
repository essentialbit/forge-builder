/**
 * Forge Builder — OpenID Connect (OIDC) Configuration
 *
 * Supports sign-in via:
 *   • Google (OAuth 2.0 / OIDC) — covers Gmail accounts
 *   • GitHub (OAuth 2.0) — for developers
 *   • Yahoo (OIDC) — Yahoo Mail accounts
 *   • Email/password — existing Forge Builder accounts
 *
 * Uses Auth.js v5 (next-auth@beta) with the App Router.
 *
 * Setup required in .env:
 *   AUTH_SECRET=<random 32+ char string>  # openssl rand -base64 32
 *   AUTH_GOOGLE_ID=<your-google-client-id>
 *   AUTH_GOOGLE_SECRET=<your-google-client-secret>
 *   AUTH_GITHUB_ID=<your-github-oauth-app-id>
 *   AUTH_GITHUB_SECRET=<your-github-oauth-app-secret>
 *   AUTH_YAHOO_ID=<your-yahoo-client-id>
 *   AUTH_YAHOO_SECRET=<your-yahoo-client-secret>
 *
 * Google setup: https://console.cloud.google.com → APIs & Services → Credentials
 *   → OAuth 2.0 Client ID (Web application)
 *   → Authorized redirect URI: https://yourdomain.com/api/auth/callback/google
 *
 * GitHub setup: https://github.com/settings/applications/new
 *   → Authorization callback URL: https://yourdomain.com/api/auth/callback/github
 *
 * Yahoo setup: https://developer.yahoo.com/apps/create/
 *   → Redirect URI: https://yourdomain.com/api/auth/callback/yahoo
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';

// Yahoo implements OIDC but isn't in the Auth.js built-in list yet.
// We define it manually using the OIDC discovery endpoint.
const YahooOIDC: Provider = {
  id: 'yahoo',
  name: 'Yahoo',
  type: 'oidc',
  issuer: 'https://api.login.yahoo.com',
  clientId: process.env.AUTH_YAHOO_ID,
  clientSecret: process.env.AUTH_YAHOO_SECRET,
  wellKnown: 'https://api.login.yahoo.com/.well-known/openid-configuration',
  authorization: { params: { scope: 'openid email profile' } },
  checks: ['pkce', 'state'],
  profile(profile: Record<string, unknown>) {
    return {
      id: String(profile['sub']),
      name: String(profile['name'] ?? profile['email'] ?? ''),
      email: String(profile['email'] ?? ''),
      image: (profile['picture'] as string | undefined) ?? null,
    };
  },
};

const providers: Provider[] = [
  // ── Google (Gmail) ────────────────────────────────────────────────────
  Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        scope: 'openid email profile',
      },
    },
  }),

  // ── GitHub ────────────────────────────────────────────────────────────
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
  }),

  // ── Yahoo ─────────────────────────────────────────────────────────────
  ...(process.env.AUTH_YAHOO_ID && process.env.AUTH_YAHOO_SECRET ? [YahooOIDC] : []),

  // ── Credentials (existing email/password accounts) ────────────────────
  Credentials({
    name: 'Email & Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getUserByEmail, verifyPassword } = require('@/lib/auth-server') as typeof import('@/lib/auth-server');
        const user = await getUserByEmail(String(credentials.email));
        if (!user) return null;
        const valid = await verifyPassword(String(credentials.password), user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      } catch {
        return null;
      }
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? token.sub;
        token.role = (user as { role?: string }).role ?? 'editor';
        token.provider = account?.provider ?? 'credentials';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { provider?: string }).provider = token.provider as string;
      }
      return session;
    },

    async signIn({ user, account }) {
      // Allow all OIDC sign-ins — create/update user record in local DB
      if (account?.type === 'oidc' || account?.provider === 'google' || account?.provider === 'github' || account?.provider === 'yahoo') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { upsertOAuthUser } = require('@/lib/auth-server') as typeof import('@/lib/auth-server');
          await upsertOAuthUser({
            email: user.email ?? '',
            name: user.name ?? '',
            provider: account.provider,
            providerId: account.providerAccountId,
            avatarUrl: user.image ?? '',
          });
        } catch { /* non-critical — allow sign-in regardless */ }
      }
      return true;
    },
  },

  // Security: use AUTH_SECRET env var (set via `openssl rand -base64 32`)
  secret: process.env.AUTH_SECRET,

  // Strict security in production
  trustHost: process.env.NODE_ENV !== 'production',
  debug: process.env.NODE_ENV === 'development',
});

// Re-export list of configured providers for the sign-in UI
export const configuredProviders = [
  { id: 'google', name: 'Google', icon: 'google' },
  { id: 'github', name: 'GitHub', icon: 'github' },
  ...(process.env.AUTH_YAHOO_ID ? [{ id: 'yahoo', name: 'Yahoo', icon: 'yahoo' }] : []),
];
