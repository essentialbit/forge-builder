import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, signToken, recordLastLogin, countUsers } from '@/lib/auth-server';

const COOKIE_NAME = 'forge-session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // If no users exist yet, redirect to setup
    const total = await countUsers();
    if (total === 0) {
      return NextResponse.json({ error: 'No accounts exist yet.', redirect: '/setup' }, { status: 403 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    await recordLastLogin(user.id);

    const token = await signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });

    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
    // Readable cookie for client UI (no sensitive data)
    res.cookies.set('forge-user', JSON.stringify({ email: user.email, name: user.name, role: user.role }), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
