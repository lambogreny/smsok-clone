/**
 * Redis caching layer for dashboard metrics and expensive queries.
 * TTL-based with stale-while-revalidate pattern.
 */

import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get cached value or compute and cache it.
 * Returns cached value if available, otherwise runs fn() and caches result.
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL,
): Promise<T> {
  const cacheKey = `cache:${key}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis down — compute directly
  }

  const result = await fn();

  try {
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(result));
  } catch {
    logger.warn("Failed to write cache", { key: cacheKey });
  }

  return result;
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(`cache:${key}`);
  } catch {
    // ignore
  }
}

/**
 * Invalidate all cache keys matching a pattern.
 * Use sparingly — SCAN can be slow on large datasets.
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  let deleted = 0;
  try {
    const stream = redis.scanStream({ match: `cache:${pattern}`, count: 100 });
    for await (const keys of stream) {
      if (keys.length > 0) {
        deleted += await redis.del(...keys);
      }
    }
  } catch {
    logger.warn("Failed to invalidate cache pattern", { pattern });
  }
  return deleted;
}

/** Pre-defined cache keys for dashboard metrics */
export const CACHE_KEYS = {
  dashboardOverview: (orgId: string) => `dashboard:overview:${orgId}`,
  adminStats: "admin:stats",
  providerHealth: "admin:provider-health",
  revenueDaily: (date: string) => `admin:revenue:${date}`,
  queueMetrics: "admin:queue-metrics",
} as const;
