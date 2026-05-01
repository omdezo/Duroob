import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { getDb } from '@/db';
import { auth } from '@/lib/auth';
import { apiLimiter, readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

const SaveTripSchema = z.object({
  title: z.string().trim().min(1).max(120),
  inputsJson: z.record(z.string(), z.unknown()).optional(),
  planJson: z.record(z.string(), z.unknown()),
  scoresJson: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ data: [] });
    }

    const sql = getDb();
    const userId = (session.user as any).id;
    const data = await sql`
      SELECT id, user_id, title, inputs_json, plan_json, scores_json,
             COALESCE(is_public, FALSE) AS is_public,
             COALESCE(share_count, 0) AS share_count,
             created_at
      FROM saved_trips WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API] GET /api/trips error:', error);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, apiLimiter);
  if (limited) return limited;
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id || null;
    const userEmail = session?.user?.email || 'guest';

    const parsed = SaveTripSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'title and planJson required', details: parsed.error.issues }, { status: 400 });
    }

    const sql = getDb();
    const { title, planJson } = parsed.data;
    const inputsJson = parsed.data.inputsJson ?? {};
    const scoresJson = parsed.data.scoresJson ?? {};

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
