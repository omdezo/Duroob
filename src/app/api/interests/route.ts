import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { apiLimiter, readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

const InterestSchema = z.object({
  destinationId: z.string().trim().min(1).max(80),
});

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const sql = getDb();
    const rows = await sql`
      SELECT destination_id FROM saved_interests WHERE user_id = ${userId}
    `;
    return NextResponse.json({ destinationIds: rows.map((r: any) => r.destination_id) });
  } catch (error) {
    console.error('[API] GET /api/interests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, apiLimiter);
  if (limited) return limited;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const parsed = InterestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'destinationId is required' }, { status: 400 });
    }
    const sql = getDb();
    await sql`
      INSERT INTO saved_interests (user_id, destination_id)
      VALUES (${userId}, ${parsed.data.destinationId})
      ON CONFLICT DO NOTHING
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] POST /api/interests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const limited = await rateLimit(request, apiLimiter);
  if (limited) return limited;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const parsed = InterestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'destinationId is required' }, { status: 400 });
    }
    const sql = getDb();
    await sql`
      DELETE FROM saved_interests
      WHERE user_id = ${userId} AND destination_id = ${parsed.data.destinationId}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/interests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
