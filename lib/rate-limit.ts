/**
 * In-memory rate limiter for API routes
 * Limits requests per IP/API key within a sliding window
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export type RateLimitConfig = {
  windowMs: number;  // Time window in ms
  maxRequests: number; // Max requests per window
};

const DEFAULTS: Record<string, RateLimitConfig> = {
  sms: { windowMs: 60_000, maxRequests: 10 },         // 10 SMS/min
  batch: { windowMs: 60_000, maxRequests: 5 },         // 5 batch/min
  auth: { windowMs: 15 * 60_000, maxRequests: 10 },    // 10 login attempts/15min
  api: { windowMs: 60_000, maxRequests: 60 },           // 60 req/min general
  slip: { windowMs: 60_000, maxRequests: 5 },           // 5 slip verifications/min
  password: { windowMs: 15 * 60_000, maxRequests: 5 },  // 5 password changes/15min
  apikey: { windowMs: 60_000, maxRequests: 10 },         // 10 key ops/min
  import: { windowMs: 60_000, maxRequests: 5 },          // 5 imports/min
  admin: { windowMs: 60_000, maxRequests: 30 },              // 30 admin ops/min
  otp_generate: { windowMs: 5 * 60_000, maxRequests: 3 },     // 3 OTP sends/5min (architect spec #100)
  otp_verify: { windowMs: 15 * 60_000, maxRequests: 10 },    // 10 verify attempts/15min
};

export function checkRateLimit(
  identifier: string,
  type: keyof typeof DEFAULTS = "api"
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = DEFAULTS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetIn: entry.resetAt - now };
}

export function rateLimitResponse(resetIn: number) {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(resetIn / 1000)),
        "X-RateLimit-Reset": String(Math.ceil(resetIn / 1000)),
      },
    }
  );
}
