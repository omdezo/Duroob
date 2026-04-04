import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sql = getDb();

  if (body.role && ['user', 'admin'].includes(body.role)) {
    await sql`UPDATE users SET role = ${body.role} WHERE id = ${id}`;
    await sql`INSERT INTO audit_log (admin_email, action, target_type, target_id, details) VALUES ('admin', 'user_role_changed', 'user', ${id}, ${'Role changed to ' + body.role})`;
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM users WHERE id = ${id}`;
  await sql`INSERT INTO audit_log (admin_email, action, target_type, target_id, details) VALUES ('admin', 'user_deleted', 'user', ${id}, 'User deleted')`;
  return NextResponse.json({ success: true });
}
