import { NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET() {
  try {
    const sql = getDb();
    const users = await sql`SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC`;
    return NextResponse.json({ users });
  } catch (error) {
    console.error('[API] GET /api/admin/users error:', error);
    return NextResponse.json({ users: [] });
  }
}
