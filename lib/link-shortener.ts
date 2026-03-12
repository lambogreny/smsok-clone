/**
 * Link Shortener — Generate short codes, track clicks, append UTM params
 */

import { prisma as db } from "./db";
import crypto from "crypto";

const BASE_URL = process.env.SHORT_LINK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://smsok.com";

// Private/reserved IP ranges to block (SSRF prevention)
const BLOCKED_HOSTS = ["localhost", "0.0.0.0", "[::1]"];
const PRIVATE_IP_RANGES = [
  /^127\./,           // 127.0.0.0/8
  /^10\./,            // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./,      // 192.168.0.0/16
  /^169\.254\./,      // 169.254.0.0/16 (link-local)
];

/**
 * Validate URL — only allow http/https, block private IPs and dangerous schemes
 */
function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL ไม่ถูกต้อง");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("รองรับเฉพาะ http:// และ https:// เท่านั้น");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(hostname)) {
    throw new Error("ไม่อนุญาตให้ใช้ URL ภายใน");
  }

  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) {
      throw new Error("ไม่อนุญาตให้ใช้ IP ภายใน");
    }
  }
}

/**
 * Generate a unique short code (6 chars, URL-safe base62)
 */
function generateShortCode(): string {
  return crypto.randomBytes(4).toString("base64url").slice(0, 6);
}

/**
 * Append UTM parameters to a URL
 */
export function appendUtmParams(
  url: string,
  params: { source?: string; medium?: string; campaign?: string },
): string {
  try {
    const parsed = new URL(url);
    if (params.source) parsed.searchParams.set("utm_source", params.source);
    if (params.medium) parsed.searchParams.set("utm_medium", params.medium);
    if (params.campaign) parsed.searchParams.set("utm_campaign", params.campaign);
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Create a shortened link with optional UTM params
 */
export async function createShortLink(opts: {
  userId: string;
  originalUrl: string;
  organizationId?: string;
  campaignId?: string;
  messageId?: string;
  utmCampaign?: string;
  expiresAt?: Date;
}): Promise<{ shortCode: string; shortUrl: string; originalUrl: string }> {
  // SECURITY: Validate URL before processing (SSRF + open redirect prevention)
  validateUrl(opts.originalUrl);

  // Append UTM params to original URL
  const urlWithUtm = appendUtmParams(opts.originalUrl, {
    source: "smsok",
    medium: "sms",
    campaign: opts.utmCampaign,
  });

  // Generate unique short code with retry
  let shortCode: string;
  let attempts = 0;
  do {
    shortCode = generateShortCode();
    const existing = await db.shortLink.findUnique({ where: { shortCode } });
    if (!existing) break;
    attempts++;
  } while (attempts < 5);

  if (attempts >= 5) {
    throw new Error("ไม่สามารถสร้าง short code ได้ กรุณาลองใหม่");
  }

  const link = await db.shortLink.create({
    data: {
      shortCode,
      originalUrl: urlWithUtm,
      userId: opts.userId,
      organizationId: opts.organizationId,
      campaignId: opts.campaignId,
      messageId: opts.messageId,
      expiresAt: opts.expiresAt,
    },
  });

  return {
    shortCode: link.shortCode,
    shortUrl: `${BASE_URL}/r/${link.shortCode}`,
    originalUrl: link.originalUrl,
  };
}

/**
 * Resolve a short code → original URL + increment click
 * Returns null if not found or expired
 */
export async function resolveShortLink(
  shortCode: string,
  meta?: { ipAddress?: string; userAgent?: string; referer?: string },
): Promise<string | null> {
  const link = await db.shortLink.findUnique({
    where: { shortCode },
    select: { id: true, originalUrl: true, expiresAt: true, userId: true, campaignId: true },
  });

  if (!link) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;

  // Increment click count + record event (fire and forget)
  db.$transaction([
    db.shortLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 }, lastClickedAt: new Date() },
    }),
    db.clickEvent.create({
      data: {
        shortLinkId: link.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent?.slice(0, 500),
        referer: meta?.referer?.slice(0, 500),
      },
    }),
  ]).catch((err) => console.error("[shortlink] click tracking error:", err));

  // Fire sms.clicked webhook (async, non-blocking)
  import("./webhook-dispatch").then(({ dispatchWebhookEvent }) => {
    dispatchWebhookEvent(link.userId, "sms.clicked" as Parameters<typeof dispatchWebhookEvent>[1], {
      shortCode,
      originalUrl: link.originalUrl,
      campaignId: link.campaignId,
    });
  }).catch(() => {});

  return link.originalUrl;
}

/**
 * Get click stats for a short link
 */
export async function getShortLinkStats(userId: string, linkId: string) {
  const link = await db.shortLink.findFirst({
    where: { id: linkId, userId },
    select: {
      id: true,
      shortCode: true,
      originalUrl: true,
      clicks: true,
      lastClickedAt: true,
      createdAt: true,
      campaignId: true,
    },
  });
  if (!link) throw new Error("ไม่พบ link");

  // Get click timeline (last 30 days, grouped by day)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const clickEvents = await db.clickEvent.findMany({
    where: { shortLinkId: link.id, createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const daily: Record<string, number> = {};
  for (const event of clickEvents) {
    const day = event.createdAt.toISOString().slice(0, 10);
    daily[day] = (daily[day] || 0) + 1;
  }

  return {
    ...link,
    shortUrl: `${BASE_URL}/r/${link.shortCode}`,
    dailyClicks: Object.entries(daily).map(([date, count]) => ({ date, count })),
  };
}

/**
 * Extract URLs from SMS text and replace with short links
 */
export async function shortenLinksInMessage(
  text: string,
  opts: {
    userId: string;
    organizationId?: string;
    campaignId?: string;
    campaignName?: string;
  },
): Promise<{ text: string; shortLinks: string[] }> {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const urls = text.match(urlRegex);

  if (!urls || urls.length === 0) {
    return { text, shortLinks: [] };
  }

  const shortLinks: string[] = [];
  let result = text;

  for (const url of urls) {
    const link = await createShortLink({
      userId: opts.userId,
      originalUrl: url,
      organizationId: opts.organizationId,
      campaignId: opts.campaignId,
      utmCampaign: opts.campaignName,
    });
    result = result.replace(url, link.shortUrl);
    shortLinks.push(link.shortCode);
  }

  return { text: result, shortLinks };
}
