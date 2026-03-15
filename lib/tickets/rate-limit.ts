import { createHash } from "node:crypto";
import { ApiError } from "@/lib/api-auth";
import { logger as log } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { getClientIp } from "@/lib/session-utils";

type SupportTicketRateLimitAction = "create" | "reply";

const SUPPORT_TICKET_RATE_LIMITS: Record<
  SupportTicketRateLimitAction,
  { max: number; windowSeconds: number; label: string }
> = {
  create: {
    max: 3,
    windowSeconds: 15 * 60,
    label: "สร้าง ticket ",
  },
  reply: {
    max: 10,
    windowSeconds: 5 * 60,
    label: "ตอบ ticket ",
  },
};

function buildSupportTicketRateLimitKey(
  requestHeaders: Headers,
  userId: string,
  action: SupportTicketRateLimitAction,
) {
  const clientIp = getClientIp(requestHeaders).trim().toLowerCase() || "unknown";
  const hashedIp = createHash("sha256").update(clientIp).digest("hex");
  return `rate:support-ticket:${action}:${userId}:${hashedIp}`;
}

function formatSupportTicketRateLimitMessage(
  action: SupportTicketRateLimitAction,
  retryAfter: number,
) {
  const config = SUPPORT_TICKET_RATE_LIMITS[action];
  const minutes = Math.floor(config.windowSeconds / 60);
  return `${config.label}ได้สูงสุด ${config.max} ครั้งใน ${minutes} นาที กรุณาลองใหม่ใน ${retryAfter} วินาที`;
}

export async function enforceSupportTicketRateLimit(
  requestHeaders: Headers,
  userId: string,
  action: SupportTicketRateLimitAction,
) {
  const config = SUPPORT_TICKET_RATE_LIMITS[action];
  const key = buildSupportTicketRateLimitKey(requestHeaders, userId, action);

  try {
    const attemptCount = await redis.incr(key);
    if (attemptCount === 1) {
      await redis.expire(key, config.windowSeconds);
    }

    if (attemptCount > config.max) {
      const retryAfter = Math.max(await redis.ttl(key), 1);
      throw new ApiError(429, formatSupportTicketRateLimitMessage(action, retryAfter));
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    log.warn(
      "Support ticket rate limit unavailable",
      { error: error instanceof Error ? error.message : String(error), action, userId },
    );
  }
}
