import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/auth';

export async function GET() {
  try {
    const usersMap = getUsers();
    const users = [...usersMap.values()].map(({ password, ...user }) => user);
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [] });
  }
}
