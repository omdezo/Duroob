import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

// Returns the *calling user's* chat sessions, not the entire table.
// Admins should use /api/admin/chat for the full list.
export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ sessions: [] });
    }
    const userId = (session.user as any).id;
    const sql = getDb();
    const sessions = await sql`
      SELECT id, message_count, has_plan, last_message, created_at, updated_at
      FROM chat_sessions
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('[API] GET /api/chat/sessions error:', error);
    return NextResponse.json({ sessions: [] });
  }
}
