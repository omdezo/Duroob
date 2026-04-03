import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DESTINATIONS } from '@/data/destinations';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.toLowerCase().trim() ?? '';

    if (!q) {
      return NextResponse.json({ data: [] });
    }

    const results = DESTINATIONS.filter(
      (d) =>
        d.name.en.toLowerCase().includes(q) ||
        d.name.ar.includes(q) ||
        d.region.en.toLowerCase().includes(q) ||
        d.region.ar.includes(q),
    ).slice(0, 10);

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('[API] GET /api/search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 },
    );
  }
}
