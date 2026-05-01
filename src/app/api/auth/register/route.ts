import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod/v4';
import { getDb } from '@/db';
import { authLimiter } from '@/lib/rateLimit';
import { rateLimit } from '@/lib/withRateLimit';

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  const limited = await rateLimit(req, authLimiter);
  if (limited) return limited;

  try {
    const parsed = RegisterSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const sql = getDb();
    const existing = await sql`SELECT count(*)::int AS count FROM users WHERE email = ${email}`;
    if (existing[0].count > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO users (email, name, password, role)
      VALUES (${email}, ${name}, ${hashedPassword}, ${'user'})
    `;
    return NextResponse.json({ success: true, message: 'Account created' }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/auth/register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
