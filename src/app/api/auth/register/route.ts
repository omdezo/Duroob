import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/db';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const sql = getDb();
    const emailLower = email.toLowerCase();

    // Check for duplicate email
    const existing = await sql`SELECT count(*)::int AS count FROM users WHERE email = ${emailLower}`;
    if (existing[0].count > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (email, name, password, role)
      VALUES (${emailLower}, ${name}, ${hashedPassword}, ${'user'})
    `;

    return NextResponse.json({ success: true, message: 'Account created' }, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/auth/register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
