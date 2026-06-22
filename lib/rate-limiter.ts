import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup map periodically to prevent memory leaks
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }, 60000).unref?.();
}

/**
 * rateLimiter
 * Simple in-memory sliding-window-ish rate limiter for serverless warm instances.
 * Limit: default 5 requests per 60 seconds per IP.
 */
export function isRateLimited(
  request: NextRequest,
  limit = 5,
  windowMs = 60000
): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous_ip';
  const key = `rl:${ip}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (now > record.resetTime) {
    // Window expired, reset
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  record.count += 1;
  if (record.count > limit) {
    return true;
  }

  return false;
}
