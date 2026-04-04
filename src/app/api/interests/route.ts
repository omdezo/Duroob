import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const sql = getDb();
    const rows = await sql`
      SELECT destination_id FROM saved_interests WHERE user_id = ${userId}
    `;
    const destinationIds = rows.map((r: any) => r.destination_id);
    return NextResponse.json({ destinationIds });
  } catch (error) {
    console.error('[API] GET /api/interests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { destinationId } = await request.json();

    if (!destinationId) {
      return NextResponse.json({ error: 'destinationId is required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      INSERT INTO saved_interests (user_id, destination_id)
      VALUES (${userId}, ${destinationId})
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] POST /api/interests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { destinationId } = await request.json();

    if (!destinationId) {
      return NextResponse.json({ error: 'destinationId is required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      DELETE FROM saved_interests
      WHERE user_id = ${userId} AND destination_id = ${destinationId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/interests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
