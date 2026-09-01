/**
 * In-memory token bucket, per client IP. This only works for a single
 * running instance — on Vercel, each serverless invocation/region can get
 * its own memory, so this is a best-effort throttle, not a hard guarantee.
 * A real deployment protecting a paid ML feature would want a shared store
 * (e.g. Vercel KV / Upstash) instead; noted here rather than silently
 * pretending this scales.
 */
export interface RateLimiter {
  isRateLimited(clientId: string): boolean;
}

/**
 * Each caller gets its own bucket map — `/api/similar` and `/api/passages`
 * have different limits (20/min vs 10/min) and must not share one client's
 * count across both routes.
 */
export function createRateLimiter(windowMs: number, maxRequests: number): RateLimiter {
  const buckets = new Map<string, { count: number; windowStart: number }>();

  return {
    isRateLimited(clientId: string): boolean {
      const now = Date.now();
      const bucket = buckets.get(clientId);

      if (!bucket || now - bucket.windowStart > windowMs) {
        buckets.set(clientId, { count: 1, windowStart: now });
        return false;
      }

      bucket.count += 1;
      return bucket.count > maxRequests;
    },
  };
}
