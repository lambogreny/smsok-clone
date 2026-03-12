/**
 * Rate Limiter — Redis sliding window (primary) + in-memory fallback
 * Uses Redis sorted sets for distributed rate limiting across instances.
 * Falls back to in-memory when Redis unavailable.
 */

// NOTE: Do NOT import redis at top-level — this file is used by middleware
// (edge runtime) where ioredis cannot load.  Use dynamic import inside
// checkRateLimitAsync / applyRateLimit instead.

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const DEFAULTS: Record<string, RateLimitConfig> = {
  sms: { windowMs: 60_000, maxRequests: 10 },
  batch: { windowMs: 60_000, maxRequests: 5 },
  auth: { windowMs: 15 * 60_000, maxRequests: 10 },
  auth_login: { windowMs: 15 * 60_000, maxRequests: 20 },
  auth_register: { windowMs: 15 * 60_000, maxRequests: 10 },
  api: { windowMs: 60_000, maxRequests: 60 },
  slip: { windowMs: 60_000, maxRequests: 5 },
  password: { windowMs: 15 * 60_000, maxRequests: 5 },
  apikey: { windowMs: 60_000, maxRequests: 10 },
  import: { windowMs: 60_000, maxRequests: 5 },
  admin: { windowMs: 60_000, maxRequests: 30 },
  otp_generate: { windowMs: 10 * 60_000, maxRequests: 3 },
  otp_verify: { windowMs: 15 * 60_000, maxRequests: 10 },
  // Security-critical — strict limits (per IP)
  admin_login: { windowMs: 60_000, maxRequests: 5 },
  otp_send: { windowMs: 60_000, maxRequests: 3 },
  // Sender name submission — 5 req/min per user
  sender_name: { windowMs: 60_000, maxRequests: 5 },
  // Payment routes — 10 req/min per user
  purchase: { windowMs: 60_000, maxRequests: 10 },
  coupon_validate: { windowMs: 60_000, maxRequests: 10 },
  topup_verify: { windowMs: 60_000, maxRequests: 10 },
  invoice_create: { windowMs: 60_000, maxRequests: 10 },
  invoice_pdf: { windowMs: 60_000, maxRequests: 10 },
  wht_upload: { windowMs: 60_000, maxRequests: 10 },
  tax_profile: { windowMs: 60_000, maxRequests: 10 },
  // Templates — customer-facing
  template: { windowMs: 60_000, maxRequests: 30 },             // 30/min
  // Support ticket — customer-facing
  ticket_create: { windowMs: 60 * 60_000, maxRequests: 5 },   // 5/hour
  ticket_reply: { windowMs: 60_000, maxRequests: 10 },         // 10/min
  kb_read: { windowMs: 60_000, maxRequests: 60 },              // 60/min
};

function shouldBypassRateLimit() {
  return process.env.NODE_ENV === "development";
}

/**
 * Check rate limit using Redis sliding window (async).
 * Returns: { allowed, remaining, resetIn }
 */
export async function checkRateLimitAsync(
  identifier: string,
  type: keyof typeof DEFAULTS = "api",
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  if (shouldBypassRateLimit()) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetIn: 0 };
  }

  const config = DEFAULTS[type];
  if (!config) return { allowed: true, remaining: 999, resetIn: 0 };

  const key = `${type}:${identifier}`;
  const { redisRateLimit } = await import("./redis");
  return redisRateLimit(key, config.maxRequests, config.windowMs);
}

/**
 * Apply rate limit and return 429 Response if blocked, null if allowed.
 * Sets X-RateLimit headers.
 */
export async function applyRateLimit(
  identifier: string,
  type: keyof typeof DEFAULTS = "api",
): Promise<{ blocked: Response | null; headers: Record<string, string> }> {
  if (shouldBypassRateLimit()) {
    return {
      blocked: null,
      headers: {
        "X-RateLimit-Limit": "dev-bypass",
        "X-RateLimit-Remaining": "unlimited",
        "X-RateLimit-Reset": "0",
      },
    };
  }

  const config = DEFAULTS[type];
  if (!config) return { blocked: null, headers: {} };

  const result = await checkRateLimitAsync(identifier, type);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetIn / 1000)),
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil(result.resetIn / 1000);
    return {
      blocked: Response.json(
        { error: `คำขอมากเกินไป กรุณารอ ${retryAfter} วินาที` },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(retryAfter),
          },
        },
      ),
      headers,
    };
  }

  return { blocked: null, headers };
}

/**
 * Sync rate limiter (in-memory) — used by existing routes.
 * For new routes, prefer applyRateLimit() which uses Redis.
 */
const memStore = new Map<string, { count: number; resetAt: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (entry.resetAt < now) memStore.delete(key);
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  identifier: string,
  type: keyof typeof DEFAULTS = "api",
): { allowed: boolean; remaining: number; resetIn: number } {
  if (shouldBypassRateLimit()) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, resetIn: 0 };
  }

  const config = DEFAULTS[type];
  if (!config) return { allowed: true, remaining: 999, resetIn: 0 };

  const key = `${type}:${identifier}`;
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + config.windowMs });
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
    },
  );
}
