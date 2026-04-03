import { NextResponse } from 'next/server';
import { getChatSessions } from '@/lib/adminStore';

export async function GET() {
  const sessions = getChatSessions();
  return NextResponse.json({ sessions });
}
