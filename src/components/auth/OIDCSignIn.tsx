"use client";

/**
 * Forge Builder — OIDC Sign-In Buttons
 *
 * Renders social sign-in buttons for Google, GitHub, and Yahoo.
 * Uses Auth.js v5 client-side signIn action.
 *
 * Drop this into the existing /login page alongside the email/password form.
 */

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderConfig {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  logo: React.ReactNode;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'google',
    name: 'Continue with Google',
    bgClass: 'bg-white hover:bg-gray-50',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-300',
    logo: (
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'Continue with GitHub',
    bgClass: 'bg-[#24292e] hover:bg-[#1b1f23]',
    textClass: 'text-white',
    borderClass: 'border-transparent',
    logo: (
      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.28-.01-1.03-.02-2.03-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02 0 2.04.13 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
      </svg>
    ),
  },
  {
    id: 'yahoo',
    name: 'Continue with Yahoo',
    bgClass: 'bg-[#6001D2] hover:bg-[#5200b8]',
    textClass: 'text-white',
    borderClass: 'border-transparent',
    logo: (
      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
        <path d="M0 0l6.1 14.3 6.5-14.3h6.5l-11 24H2.5l2.7-6L0 0h0zm18.5 0h5.5l-8 18.1h-5.5L18.5 0z" />
      </svg>
    ),
  },
];

interface OIDCSignInProps {
  callbackUrl?: string;
  className?: string;
  showDivider?: boolean;
}

export function OIDCSignIn({ callbackUrl = '/', className, showDivider = true }: OIDCSignInProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId);
    try {
      await signIn(providerId, { callbackUrl });
    } catch { /* Auth.js handles redirect internally */ }
    finally { setLoading(null); }
  };

  // Filter to only providers that are configured (Yahoo requires env vars)
  const activeProviders = PROVIDERS.filter((p) => {
    if (p.id === 'yahoo') return !!process.env.NEXT_PUBLIC_YAHOO_ENABLED;
    return true; // Google and GitHub are always shown (they degrade gracefully)
  });

  return (
    <div className={cn('space-y-3', className)}>
      {showDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-500">or continue with</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {activeProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleSignIn(provider.id)}
            disabled={loading !== null}
            className={cn(
              'w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150',
              provider.bgClass,
              provider.textClass,
              provider.borderClass,
              loading === provider.id ? 'opacity-70 cursor-wait' : 'cursor-pointer',
              loading !== null && loading !== provider.id ? 'opacity-40' : ''
            )}
          >
            {loading === provider.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              provider.logo
            )}
            {provider.name}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-slate-600 text-center leading-relaxed">
        By signing in, you agree to our{' '}
        <a href="/terms" className="text-slate-500 hover:text-slate-300 underline">Terms</a>
        {' '}and{' '}
        <a href="/privacy" className="text-slate-500 hover:text-slate-300 underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
