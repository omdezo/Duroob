import { NextResponse } from 'next/server';
import { getTripAnalytics } from '@/lib/adminStore';

export async function GET() {
  const analytics = getTripAnalytics();
  return NextResponse.json(analytics);
}
