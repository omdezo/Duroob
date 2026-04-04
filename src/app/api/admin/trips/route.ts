import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  try {
    const check = await requireAdmin();
    if ('error' in check && check.error instanceof NextResponse) return check.error;

    const sql = getDb();

    const [records, statsResult, tierRows, regionRows] = await Promise.all([
      sql`SELECT * FROM trip_analytics ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT count(*)::int AS total, coalesce(avg(duration), 0) AS avg_duration, coalesce(avg(total_cost), 0) AS avg_cost FROM trip_analytics`,
      sql`SELECT tier, count(*)::int AS count FROM trip_analytics GROUP BY tier`,
      sql`SELECT unnest(regions) AS region, count(*)::int AS count FROM trip_analytics GROUP BY region`,
    ]);

    const { total, avg_duration, avg_cost } = statsResult[0];

    const tierDistribution: Record<string, number> = {};
    for (const row of tierRows) {
      tierDistribution[row.tier] = row.count;
    }

    const regionDistribution: Record<string, number> = {};
    for (const row of regionRows) {
      regionDistribution[row.region] = row.count;
    }

    return NextResponse.json({
      records,
      total,
      avgDuration: Number(avg_duration),
      avgCost: Number(avg_cost),
      tierDistribution,
      regionDistribution,
    });
  } catch (error) {
    console.error('[API] GET /api/admin/trips error:', error);
    return NextResponse.json({
      records: [],
      total: 0,
      avgDuration: 0,
      avgCost: 0,
      tierDistribution: {},
      regionDistribution: {},
    });
  }
}
