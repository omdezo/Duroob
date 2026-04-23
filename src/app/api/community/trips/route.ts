import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { auth } from '@/lib/auth';

// GET /api/community/trips?limit=24&region=muscat
// Lists public saved trips + a "for you" personalized slice if authed.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 60);
    const region = searchParams.get('region');
    const sql = getDb();

    const rows = region
      ? await sql`
          SELECT t.id, t.title, t.inputs_json, t.plan_json, t.scores_json, t.share_count, t.created_at,
                 u.name AS author_name
          FROM saved_trips t
          LEFT JOIN users u ON u.id = t.user_id
          WHERE t.is_public = TRUE
            AND EXISTS (
              SELECT 1 FROM jsonb_array_elements(t.plan_json->'days') d
              WHERE d->>'region' = ${region}
            )
          ORDER BY t.share_count DESC, t.created_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT t.id, t.title, t.inputs_json, t.plan_json, t.scores_json, t.share_count, t.created_at,
                 u.name AS author_name
          FROM saved_trips t
          LEFT JOIN users u ON u.id = t.user_id
          WHERE t.is_public = TRUE
          ORDER BY t.share_count DESC, t.created_at DESC
          LIMIT ${limit}
        `;

    // Personalized "for you" — rank by interest overlap if authed
    const session = await auth();
    const userId = (session?.user as any)?.id;
    let forYou: typeof rows = [];

    if (userId) {
      const userTrips = await sql`
        SELECT inputs_json, plan_json FROM saved_trips WHERE user_id = ${userId} LIMIT 20
      `;
      const userRegions = new Set<string>();
      const userCats = new Set<string>();
      for (const t of userTrips) {
        for (const d of (t.plan_json?.days || [])) userRegions.add(d.region);
        for (const c of (t.inputs_json?.preferredCategories || [])) userCats.add(c);
      }

      forYou = rows
        .map((t: any) => {
          const regions = new Set((t.plan_json?.days || []).map((d: any) => d.region));
          const cats = new Set(t.inputs_json?.preferredCategories || []);
          let score = 0;
          regions.forEach((r) => { if (userRegions.has(r as string)) score += 2; });
          cats.forEach((c) => { if (userCats.has(c as string)) score += 1; });
          return { ...t, _matchScore: score };
        })
        .filter((t: any) => t._matchScore > 0)
        .sort((a: any, b: any) => b._matchScore - a._matchScore)
        .slice(0, 6);
    }

    return NextResponse.json({ trips: rows, forYou });
  } catch (error) {
    console.error('[API] GET /api/community/trips error:', error);
    return NextResponse.json({ trips: [], forYou: [] });
  }
}
