import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import bcrypt from 'bcryptjs';
import { apiLimiter, readLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

const ProfileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  currentPassword: z.string().min(1).max(128).optional(),
  newPassword: z.string().min(6).max(128).optional(),
});

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, readLimiter);
  if (limited) return limited;
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
  const limited = await rateLimit(request, apiLimiter);
  if (limited) return limited;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const parsed = ProfileUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { name, currentPassword, newPassword } = parsed.data;
    const sql = getDb();

    if (name !== undefined) {
      await sql`UPDATE users SET name = ${name} WHERE id = ${userId}`;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      const rows = await sql`SELECT password FROM users WHERE id = ${userId}`;
      if (rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const valid = await bcrypt.compare(currentPassword, rows[0].password);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await sql`UPDATE users SET password = ${hashed} WHERE id = ${userId}`;
    }

    const updated = await sql`
      SELECT id, email, name, role, created_at FROM users WHERE id = ${userId}
    `;
    return NextResponse.json({ success: true, user: updated[0] });
  } catch (error) {
    console.error('[API] PUT /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
