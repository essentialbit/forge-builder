import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, updateUser, deleteUser, generateResetToken, getUserById } from '@/lib/auth-server';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('forge-session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const fields: Parameters<typeof updateUser>[1] = {};
  if (body.name !== undefined) fields.name = body.name;
  if (body.role !== undefined) fields.role = body.role;
  if (body.password !== undefined) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    fields.password = body.password;
  }
  await updateUser(id, fields);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  // Prevent self-deletion
  if (admin.sub === id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}

// Generate a password reset link for any user (admin action)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const result = await generateResetToken(user.email);
  return NextResponse.json({ resetUrl: result?.resetUrl ?? null });
}
