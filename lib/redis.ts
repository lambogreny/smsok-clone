import Redis from "ioredis";
import { logger } from "@/lib/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function createRedisClient() {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) return null; // stop retrying
      return Math.min(times * 200, 5000);
    },
    lazyConnect: true,
  });

  client.on("error", (err) => {
    logger.error("Redis connection error", { error: err.message });
  });

  client.on("connect", () => {
    logger.info("Redis connected", { url: REDIS_URL.replace(/\/\/.*@/, "//***@") });
  });

  return client;
}

// Singleton — reuse across hot reloads in dev
const globalForRedis = globalThis as unknown as { redis: Redis | undefined };
export const redis = globalForRedis.redis ?? createRedisClient();
if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

/**
 * Redis sliding window rate limiter
 * Uses sorted sets for precise sliding window counts
 */
export async function redisRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;

  try {
    const pipeline = redis.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // Count current window
    pipeline.zcard(redisKey);
    // Add current request
    pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
    // Set expiry
    pipeline.pexpire(redisKey, windowMs);

    const results = await pipeline.exec();
    const count = (results?.[1]?.[1] as number) || 0;

    if (count >= limit) {
      // Get oldest entry to calculate reset time
      const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
      const resetAt = oldest.length >= 2 ? Number(oldest[1]) + windowMs : now + windowMs;
      return { allowed: false, remaining: 0, resetIn: resetAt - now };
    }

    return { allowed: true, remaining: limit - count - 1, resetIn: windowMs };
  } catch {
    // Redis down — fall through to allow request (fail-open)
    return { allowed: true, remaining: limit, resetIn: windowMs };
  }
}

/**
 * Check Redis health for /api/health endpoint
 */
export async function redisHealthCheck(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    await redis.ping();
    return { status: "ok", latency: Date.now() - start };
  } catch {
    return { status: "error" };
  }
}
