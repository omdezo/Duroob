import { NextResponse } from 'next/server';
import { checkRateLimit } from './rateLimit';

type Limiter = { limit: (id: string) => Promise<{ success: boolean; remaining: number }> };

/**
 * Wrap a route handler with a rate-limit check. Identifier is the X-Forwarded-For
 * IP, falling back to "anonymous". Returns 429 when over the limit.
 */
export async function rateLimit(req: Request, limiter: Limiter): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
  const { allowed, remaining } = await checkRateLimit(limiter, ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }
  return null;
}
