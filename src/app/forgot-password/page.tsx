"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResetUrl(data.resetUrl ?? null);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl mx-auto mb-4">
            🔑
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your email to get a reset link</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5" htmlFor="email">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                />
              </div>

              {error && (
                <div className="bg-red-950/60 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    Generating link…
                  </span>
                ) : (
                  "Generate Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {resetUrl ? (
                <>
                  <div className="bg-emerald-950/60 border border-emerald-700 rounded-lg px-4 py-3 text-sm text-emerald-300">
                    Reset link generated! Copy the link below and open it in your browser. It expires in 1 hour.
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 break-all">
                    <p className="text-xs text-slate-400 mb-1 font-medium">Reset link:</p>
                    <a
                      href={resetUrl}
                      className="text-amber-400 hover:text-amber-300 text-xs break-all underline underline-offset-2"
                    >
                      {resetUrl}
                    </a>
                  </div>
                  <Button
                    onClick={() => window.open(resetUrl, "_self")}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    Open Reset Link
                  </Button>
                </>
              ) : (
                <div className="bg-slate-800 rounded-lg px-4 py-3 text-sm text-slate-300">
                  If that email is registered, a reset link has been generated. Check with your admin.
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center mt-6">
          <Link href="/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
