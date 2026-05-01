import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getDb } from '@/db';
import { requireAdmin } from '@/lib/requireAdmin';

const UpdateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const adminEmail = auth.session?.user?.email ?? 'admin';

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const sql = getDb();
  if (parsed.data.role) {
    await sql`UPDATE users SET role = ${parsed.data.role} WHERE id = ${id}`;
    await sql`INSERT INTO audit_log (admin_email, action, target_type, target_id, details) VALUES (${adminEmail}, 'user_role_changed', 'user', ${id}, ${'Role changed to ' + parsed.data.role})`;
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const adminEmail = auth.session?.user?.email ?? 'admin';
  const adminId = (auth.session?.user as any)?.id;

  const { id } = await params;
  if (id === adminId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM users WHERE id = ${id}`;
  await sql`INSERT INTO audit_log (admin_email, action, target_type, target_id, details) VALUES (${adminEmail}, 'user_deleted', 'user', ${id}, 'User deleted')`;
  return NextResponse.json({ success: true });
}
