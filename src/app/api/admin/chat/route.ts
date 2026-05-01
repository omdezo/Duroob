import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const sql = getDb();
    const sessions = await sql`SELECT * FROM chat_sessions ORDER BY updated_at DESC`;
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('[API] GET /api/admin/chat error:', error);
    return NextResponse.json({ sessions: [] });
  }
}
