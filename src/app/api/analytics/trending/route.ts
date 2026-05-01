import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

export async function GET(request: Request) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM trip_analytics ORDER BY created_at DESC LIMIT 10`;
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
