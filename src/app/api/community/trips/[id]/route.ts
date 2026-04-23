import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';

// GET /api/community/trips/:id  →  returns a single public trip
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sql = getDb();
    const rows = await sql`
      SELECT t.id, t.title, t.inputs_json, t.plan_json, t.scores_json, t.share_count, t.created_at,
             u.name AS author_name
      FROM saved_trips t
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.id = ${id} AND t.is_public = TRUE
      LIMIT 1
    `;
    if (rows.length === 0) return NextResponse.json({ trip: null }, { status: 404 });
    return NextResponse.json({ trip: rows[0] });
  } catch (error) {
    console.error('[API] GET /api/community/trips/:id error:', error);
    return NextResponse.json({ trip: null }, { status: 500 });
  }
}
