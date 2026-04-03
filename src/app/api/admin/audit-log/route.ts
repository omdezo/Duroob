import { NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const sql = getDb();

    const [entries, countResult] = await Promise.all([
      sql`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      sql`SELECT count(*)::int AS total FROM audit_log`,
    ]);

    return NextResponse.json({ entries, total: countResult[0].total });
  } catch (error) {
    console.error('[API] GET /api/admin/audit-log error:', error);
    return NextResponse.json({ entries: [], total: 0 });
  }
}
