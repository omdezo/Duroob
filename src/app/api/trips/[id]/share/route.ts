import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { auth } from '@/lib/auth';

// POST /api/trips/:id/share   body: { isPublic: boolean }
// Toggles public visibility of a trip. Must be the trip owner.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { isPublic } = await request.json();
    if (typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic must be boolean' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      UPDATE saved_trips
      SET is_public = ${isPublic}
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

// POST-ish counter bump on view — separate endpoint to avoid conflating writes
// GET /api/trips/:id/share  →  bumps share_count (fire-and-forget from community page)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
