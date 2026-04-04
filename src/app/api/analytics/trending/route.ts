import { NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM trip_analytics ORDER BY created_at DESC LIMIT 10`;
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
