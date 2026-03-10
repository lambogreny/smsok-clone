/**
 * Redis connection config for BullMQ.
 * Producer: fail-fast (maxRetriesPerRequest: 3)
 * Worker: retry-forever (maxRetriesPerRequest: null)
 *
 * Redis 7.x required, maxmemory-policy=noeviction (mandatory for BullMQ)
 *
 * NOTE: We pass connection OPTIONS (not IORedis instances) to BullMQ
 * to avoid ioredis version mismatch issues.
 */

const REDIS_HOST = process.env.REDIS_HOST || "localhost"
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined

/**
 * Producer connection options — used by Queue instances.
 * Fail-fast: 3 retries max.
 */
export const producerConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
}

/**
 * Worker connection options — used by Worker instances.
 * Retry-forever: workers must reconnect automatically.
 */
export const workerConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null as null, // infinite retry for workers
  enableReadyCheck: false,
}
