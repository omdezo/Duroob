import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTrendingDestinations } from '@/lib/recommendations';

export async function GET(_request: NextRequest) {
  try {
    const trending = getTrendingDestinations();

    return NextResponse.json({ data: trending });
  } catch (error) {
    console.error('[API] GET /api/analytics/trending error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 },
    );
  }
}
