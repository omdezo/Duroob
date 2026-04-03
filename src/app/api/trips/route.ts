import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// GET /api/trips — list saved trips for the current user
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  try {
    // TODO: Query trips from DB using the authenticated user's ID
    // const session = await auth();
    // if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // const trips = await db.select().from(tripsTable).where(eq(tripsTable.userId, session.user.id));

    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('[API] GET /api/trips error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/trips — save a new trip
// ---------------------------------------------------------------------------

const CreateTripSchema = z.object({
  title: z.string().min(1).max(200),
  inputsJson: z.record(z.string(), z.unknown()),
  planJson: z.record(z.string(), z.unknown()),
  scoresJson: z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = CreateTripSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    // TODO: Insert trip into DB
    // const session = await auth();
    // if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // await db.insert(tripsTable).values({
    //   userId: session.user.id,
    //   title: parsed.data.title,
    //   inputsJson: parsed.data.inputsJson,
    //   planJson: parsed.data.planJson,
    //   scoresJson: parsed.data.scoresJson,
    // });

    return NextResponse.json(
      { success: true, message: 'Trip saved (stub — DB not wired yet)' },
      { status: 201 },
    );
  } catch (error) {
    console.error('[API] POST /api/trips error:', error);
    return NextResponse.json(
      { error: 'Failed to save trip' },
      { status: 500 },
    );
  }
}
