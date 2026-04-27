import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, listUsers, createUser, countUsers } from '@/lib/auth-server';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('forge-session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const all = await listUsers();
  return NextResponse.json({ users: all });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);

  // Allow unauthenticated creation only when zero users exist (first-run setup)
  const total = await countUsers();
  if (!admin && total > 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email, password, name, role } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    // Force first user to be admin
    const assignedRole = total === 0 ? 'admin' : (role ?? 'editor');
    const user = await createUser(email, password, name ?? '', assignedRole);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
    }
    console.error('[admin/users POST]', err);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
