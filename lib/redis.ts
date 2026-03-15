import Redis from "ioredis";
import { logger } from "@/lib/logger";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function createRedisClient(): Redis {
  if (isBuildPhase) {
    // During Next.js build, return a lazy client that won't attempt connection
    const client = new Redis({ lazyConnect: true, enableOfflineQueue: false });
    // Disconnect immediately to prevent any connection attempts
    client.disconnect();
    return client;
  }

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
