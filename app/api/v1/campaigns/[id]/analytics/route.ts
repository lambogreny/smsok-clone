import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma as db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/campaigns/:id/analytics — campaign delivery stats + CTR
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await authenticatePublicApiKey(req);

    const denied = await requireApiPermission(user.id, "read", "campaign");
    if (denied) return denied;

    const { id } = await ctx.params;

    const campaign = await db.campaign.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        creditReserved: true,
        creditUsed: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });
    if (!campaign) throw new ApiError(404, "ไม่พบแคมเปญ");

    // Message-level stats (more accurate than campaign counters)
    const messageStats = await db.message.groupBy({
      by: ["status"],
      where: { campaignId: id, userId: user.id },
      _count: { _all: true },
    });

    type StatRow = { status: string; _count: { _all: number } };
    const stats = messageStats as unknown as StatRow[];
    const delivery = {
      total: stats.reduce((s, r) => s + r._count._all, 0),
      sent: stats.find((r) => r.status === "sent")?._count._all ?? 0,
      delivered: stats.find((r) => r.status === "delivered")?._count._all ?? 0,
      failed: stats.find((r) => r.status === "failed")?._count._all ?? 0,
      pending: stats.find((r) => r.status === "pending")?._count._all ?? 0,
    };

    const deliveryRate = delivery.total > 0
      ? Math.round((delivery.delivered / delivery.total) * 10000) / 100
      : 0;

    // Click tracking stats (from short links associated with campaign)
    const linkStats = await db.shortLink.aggregate({
      where: { campaignId: id, userId: user.id },
      _sum: { clicks: true },
      _count: { _all: true },
    });

    const totalClicks = linkStats._sum.clicks ?? 0;
    const totalLinks = linkStats._count._all;
    const ctr = delivery.delivered > 0
      ? Math.round((totalClicks / delivery.delivered) * 10000) / 100
      : 0;

    // Cost: total SMS segments used
    const costStats = await db.message.aggregate({
      where: { campaignId: id, userId: user.id },
      _sum: { creditCost: true },
    });
    const totalSmsCost = costStats._sum.creditCost ?? 0;

    // Duration
    const duration = campaign.startedAt && campaign.completedAt
      ? Math.round((campaign.completedAt.getTime() - campaign.startedAt.getTime()) / 1000)
      : null;

    return apiResponse({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
        durationSeconds: duration,
      },
      delivery,
      deliveryRate,
      clicks: {
        totalClicks,
        uniqueLinks: totalLinks,
        ctr,
      },
      cost: {
        totalSmsSegments: totalSmsCost,
        totalRecipients: campaign.totalRecipients,
        creditReserved: campaign.creditReserved,
        creditUsed: campaign.creditUsed,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
