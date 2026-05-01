import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { requireAdmin } from '@/lib/requireAdmin';

const ALLOWED = new Set(['destinations', 'trips', 'users', 'audit']);

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'destinations';
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }
  const sql = getDb();

  let rows: Record<string, unknown>[] = [];
  if (type === 'destinations') rows = await sql`SELECT * FROM destinations WHERE is_active = true`;
  else if (type === 'trips') rows = await sql`SELECT * FROM trip_analytics ORDER BY created_at DESC`;
  else if (type === 'users') rows = await sql`SELECT id, email, name, role, created_at FROM users`;
  else if (type === 'audit') rows = await sql`SELECT * FROM audit_log ORDER BY created_at DESC`;

  if (rows.length === 0) return NextResponse.json({ error: 'No data' }, { status: 404 });

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=${type}.csv`,
    },
  });
}
