import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const sql = getDb();
    const rows = await sql`
      SELECT id, email, name, role, created_at FROM users WHERE id = ${userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (error) {
    console.error('[API] GET /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { name, currentPassword, newPassword } = body;
    const sql = getDb();

    // Update name if provided
    if (name !== undefined) {
      await sql`UPDATE users SET name = ${name}, updated_at = NOW() WHERE id = ${userId}`;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      // Verify current password
      const rows = await sql`SELECT password FROM users WHERE id = ${userId}`;
      if (rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const valid = await bcrypt.compare(currentPassword, rows[0].password);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await sql`UPDATE users SET password = ${hashed}, updated_at = NOW() WHERE id = ${userId}`;
    }

    // Return updated profile
    const updated = await sql`
      SELECT id, email, name, role, created_at FROM users WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (error) {
    console.error('[API] PUT /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
