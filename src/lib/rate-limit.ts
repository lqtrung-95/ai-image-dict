import { NextRequest } from 'next/server';

// Best-effort in-memory per-key rate limiter.
//
// NOTE: state lives in the serverless instance's memory, so it resets on cold
// starts and is not shared across concurrent instances. It is NOT a strong,
// distributed limit — it exists to blunt the cheap, high-impact abuse case: a
// single client hammering an unauthenticated, paid-AI endpoint (which reuses a
// warm instance). For a hard guarantee, move this to a shared store (Supabase
// table / Redis) keyed by IP.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

// Sliding fixed-window limiter: `limit` requests per `windowMs` per key.
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

// Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
export function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
