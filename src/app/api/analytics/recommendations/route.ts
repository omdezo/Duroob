import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRecommendations } from '@/lib/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const context = searchParams.get('context') ?? undefined;
    const durationRaw = searchParams.get('duration');
    const duration = durationRaw ? parseInt(durationRaw, 10) : undefined;
    const region = searchParams.get('region') ?? undefined;

    // Validate duration if provided
    if (duration !== undefined && (isNaN(duration) || duration < 1 || duration > 30)) {
      return NextResponse.json(
        { error: 'duration must be a number between 1 and 30' },
        { status: 400 },
      );
    }

    const recommendations = getRecommendations({ context, duration, region });

    return NextResponse.json({ data: recommendations });
  } catch (error) {
    console.error('[API] GET /api/analytics/recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 },
    );
  }
}
