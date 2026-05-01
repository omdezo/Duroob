import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getDb } from '@/db';
import { auth } from '@/lib/auth';
import { apiLimiter, readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

const ShareSchema = z.object({ isPublic: z.boolean() });

// POST /api/trips/:id/share   body: { isPublic: boolean }
// Toggles public visibility of a trip. Must be the trip owner.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit(request, apiLimiter);
  if (limited) return limited;

  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const parsed = ShareSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'isPublic must be boolean' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      UPDATE saved_trips
      SET is_public = ${parsed.data.isPublic}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, is_public
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found or not owned by you' }, { status: 404 });
    }
    return NextResponse.json({ success: true, isPublic: rows[0].is_public });
  } catch (error) {
    console.error('[API] POST /api/trips/:id/share error:', error);
    return NextResponse.json({ error: 'Failed to update sharing' }, { status: 500 });
  }
}

// GET /api/trips/:id/share  →  bumps share_count (fire-and-forget from community page).
// Heavily rate-limited — one IP can only bump a counter at most ~120/min.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;

  try {
    const { id } = await params;
    const sql = getDb();
    await sql`
      UPDATE saved_trips SET share_count = share_count + 1
      WHERE id = ${id} AND is_public = TRUE
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
