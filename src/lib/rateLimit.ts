import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limiter — only active when Upstash env vars are set
function createRateLimiter(requests: number, window: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // No Redis configured — return a passthrough limiter
    return {
      limit: async (_identifier: string) => ({ success: true, remaining: 999 }),
    };
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'s' | 'm' | 'h' | 'd'}`),
    analytics: true,
  });
}

// API: 60 requests per minute
export const apiLimiter = createRateLimiter(60, '1 m');

// Chat: 10 requests per minute
export const chatLimiter = createRateLimiter(10, '1 m');

// Admin writes: 5 per minute
export const adminLimiter = createRateLimiter(5, '1 m');

export async function checkRateLimit(
  limiter: { limit: (id: string) => Promise<{ success: boolean; remaining: number }> },
  identifier: string
): Promise<{ allowed: boolean; remaining: number }> {
  const result = await limiter.limit(identifier);
  return { allowed: result.success, remaining: result.remaining };
}
