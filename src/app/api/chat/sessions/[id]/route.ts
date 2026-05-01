import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { auth } from '@/lib/auth';
import { readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

// Returns messages for a chat session. If the session is bound to a user_id,
// only that user can read it. Anonymous sessions remain accessible to anyone
// who knows the ID (it's stored only in localStorage on the client).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;
  const { id } = await params;

  try {
    const sql = getDb();
    const owners = await sql`SELECT user_id FROM chat_sessions WHERE id = ${id} LIMIT 1`;
    const ownerId = (owners[0] as any)?.user_id ?? null;
    if (ownerId) {
      const session = await auth();
      const userId = (session?.user as any)?.id;
      if (userId !== ownerId) {
        return NextResponse.json({ messages: [] }, { status: 403 });
      }
    }
    const messages = await sql`
      SELECT * FROM chat_messages
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[API] GET /api/chat/sessions/[id] error:', error);
    return NextResponse.json({ messages: [] });
  }
}
