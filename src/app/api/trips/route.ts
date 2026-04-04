import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ data: [] });
    }

    const sql = getDb();
    const userId = (session.user as any).id;
    const data = await sql`SELECT * FROM saved_trips WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API] GET /api/trips error:', error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id || null;
    const userEmail = session?.user?.email || 'guest';

    const body = await request.json();

    if (!body.title || !body.planJson) {
      return NextResponse.json({ error: 'title and planJson required' }, { status: 400 });
    }

    const sql = getDb();

    const title = body.title;
    const inputsJson = body.inputsJson || {};
    const planJson = body.planJson;
    const scoresJson = body.scoresJson || {};

    const rows = await sql`
      INSERT INTO saved_trips (user_id, title, inputs_json, plan_json, scores_json)
      VALUES (${userId}, ${title}, ${JSON.stringify(inputsJson)}, ${JSON.stringify(planJson)}, ${JSON.stringify(scoresJson)})
      RETURNING *
    `;

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${userEmail}, ${'trip_saved'}, ${'trip'}, ${rows[0].id}, ${`Saved trip: ${title}`})
    `;

    return NextResponse.json({ success: true, trip: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/trips error:', error);
    return NextResponse.json({ error: 'Failed to save trip' }, { status: 500 });
  }
}
