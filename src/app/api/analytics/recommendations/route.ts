import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getActiveDestinations } from '@/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const context = url.searchParams.get('context') || 'trending_now';
    const sql = getDb();

    if (context === 'trending_now') {
      const destinations = await getActiveDestinations();
      // Return top destinations by lowest crowd level (most comfortable to visit)
      const sorted = destinations.sort((a: any, b: any) => a.crowd_level - b.crowd_level).slice(0, 5);
      return NextResponse.json({ data: sorted });
    }

    if (context === 'tier_for_duration') {
      const rows = await sql`SELECT tier, count(*) as cnt FROM trip_analytics GROUP BY tier ORDER BY cnt DESC LIMIT 1`;
      return NextResponse.json({ data: rows[0] || { tier: 'medium', cnt: 0 } });
    }

    return NextResponse.json({ data: [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
