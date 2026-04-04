import { NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET() {
  try {
    const sql = getDb();
    const sessions = await sql`SELECT * FROM chat_sessions ORDER BY updated_at DESC`;
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('[API] GET /api/chat/sessions error:', error);
    return NextResponse.json({ sessions: [] });
  }
}
