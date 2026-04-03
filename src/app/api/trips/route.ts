import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addAuditEntry } from '@/lib/adminStore';

// In-memory saved trips (replaced by DB when DATABASE_URL is set)
interface SavedTrip {
  id: string;
  title: string;
  inputsJson: any;
  planJson: any;
  scoresJson: any;
  createdAt: string;
}

const savedTrips: SavedTrip[] = [];

export async function GET() {
  return NextResponse.json({ data: savedTrips });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.planJson) {
      return NextResponse.json({ error: 'title and planJson required' }, { status: 400 });
    }

    const trip: SavedTrip = {
      id: `trip-${Date.now()}`,
      title: body.title,
      inputsJson: body.inputsJson || {},
      planJson: body.planJson,
      scoresJson: body.scoresJson || {},
      createdAt: new Date().toISOString(),
    };

    savedTrips.unshift(trip);

    addAuditEntry({
      admin: 'user',
      action: 'trip_saved',
      targetType: 'trip',
      targetId: trip.id,
      details: `Saved trip: ${trip.title}`,
    });

    return NextResponse.json({ success: true, trip }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/trips error:', error);
    return NextResponse.json({ error: 'Failed to save trip' }, { status: 500 });
  }
}
