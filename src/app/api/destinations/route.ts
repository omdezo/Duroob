import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DESTINATIONS } from '@/data/destinations';
import {
  filterDestinations,
  parseFiltersFromSearchParams,
} from '@/lib/utils/destinationFilters';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse filter/sort params via the shared utility
    const filters = parseFiltersFromSearchParams(searchParams);

    // Text search (name en/ar, region)
    const q = searchParams.get('q')?.toLowerCase().trim() ?? '';

    // Pagination
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1),
      100,
    );
    const offset = Math.max(
      parseInt(searchParams.get('offset') ?? '0', 10) || 0,
      0,
    );

    // Apply structured filters (category, region, season, sort)
    let results = filterDestinations(DESTINATIONS, filters);

    // Apply free-text search on top of structured filters
    if (q) {
      results = results.filter(
        (d) =>
          d.name.en.toLowerCase().includes(q) ||
          d.name.ar.includes(q) ||
          d.region.en.toLowerCase().includes(q) ||
          d.region.ar.includes(q),
      );
    }

    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated,
      meta: { total, limit, offset },
    });
  } catch (error) {
    console.error('[API] GET /api/destinations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch destinations' },
      { status: 500 },
    );
  }
}
