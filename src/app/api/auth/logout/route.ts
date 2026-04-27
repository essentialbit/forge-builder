import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('forge-session', '', { maxAge: 0, path: '/' });
  res.cookies.set('forge-user', '', { maxAge: 0, path: '/' });
  return res;
}
