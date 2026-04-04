import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getDb();

  try {
    const messages = await sql`
      SELECT * FROM chat_messages
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[API] GET /api/admin/chat/[id] error:', error);
    return NextResponse.json({ messages: [] });
  }
}
