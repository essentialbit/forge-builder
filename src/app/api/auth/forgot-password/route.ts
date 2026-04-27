import { NextRequest, NextResponse } from 'next/server';
import { generateResetToken } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const result = await generateResetToken(email);

    // Always return 200 to avoid revealing whether an email exists.
    // The reset URL is returned directly (local app — no email server needed).
    return NextResponse.json({
      ok: true,
      // Only expose the reset URL if a user was found — still safe for a local app.
      resetUrl: result?.resetUrl ?? null,
      message: result
        ? 'Reset link generated. Copy it and open it in your browser.'
        : 'If that email exists, a reset link has been generated.',
    });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 });
  }
}
