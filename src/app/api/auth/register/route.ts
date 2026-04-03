import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUsers } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const users = getUsers();
    const emailLower = email.toLowerCase();

    if (users.has(emailLower)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = String(users.size + 1);

    users.set(emailLower, {
      id,
      email: emailLower,
      name,
      password: hashedPassword,
      role: 'user',
    });

    return NextResponse.json({ success: true, message: 'Account created' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
