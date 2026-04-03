import { NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/adminStore';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const data = getAuditLog(limit, offset);
  return NextResponse.json(data);
}
