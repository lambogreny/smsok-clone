import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { requireApiPermission } from "@/lib/rbac";
import { createShortLink } from "@/lib/link-shortener";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const shortenSchema = z.object({
  url: z.string().url("URL ไม่ถูกต้อง"),
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// POST /api/v1/links — create short link
export async function POST(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);

    const denied = await requireApiPermission(user.id, "create", "sms");
    if (denied) return denied;

    const body = await req.json();
    const input = shortenSchema.parse(body);

    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 86400000)
      : undefined;

    const result = await createShortLink({
      userId: user.id,
      originalUrl: input.url,
      campaignId: input.campaignId,
      utmCampaign: input.campaignName,
      expiresAt,
    });

    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}

// GET /api/v1/links — list user's short links
export async function GET(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);

    const denied = await requireApiPermission(user.id, "read", "sms");
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const campaignId = searchParams.get("campaignId") || undefined;

    const where: Record<string, unknown> = { userId: user.id };
    if (campaignId) where.campaignId = campaignId;

    const [links, total] = await db.$transaction([
      db.shortLink.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          shortCode: true,
          originalUrl: true,
          clicks: true,
          lastClickedAt: true,
          campaignId: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      db.shortLink.count({ where }),
    ]);

    return apiResponse({
      links,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
