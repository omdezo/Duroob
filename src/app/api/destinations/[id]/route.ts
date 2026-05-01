import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getActiveDestinations } from '@/db';
import { readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;
  try {
    const { id } = await params;
    const destinations = await getActiveDestinations();
    const destination = destinations.find((d) => d.id === id);

    if (!destination) {
      return NextResponse.json(
        { error: `Destination with id "${id}" not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: destination });
  } catch (error) {
    console.error('[API] GET /api/destinations/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch destination' },
      { status: 500 },
    );
  }
}
