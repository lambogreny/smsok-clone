import { NextRequest } from "next/server";
import { apiSensitiveError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { executeCampaign } from "@/lib/actions/campaigns";

const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/campaigns — process scheduled campaigns
// Call via cron job: curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/campaigns
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const auth = req.headers.get("authorization");
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    const now = new Date();

    // Find scheduled campaigns that are due
    const dueCampaigns = await db.campaign.findMany({
      where: {
        status: "scheduled",
        scheduledAt: { lte: now },
      },
      select: { id: true, userId: true, name: true },
    });

    if (dueCampaigns.length === 0) {
      return Response.json({ processed: 0, message: "No scheduled campaigns due" });
    }

    const results: { id: string; name: string; status: string; error?: string }[] = [];

    for (const campaign of dueCampaigns) {
      try {
        const result = await executeCampaign(campaign.userId, campaign.id, undefined);
        results.push({ id: campaign.id, name: campaign.name, status: result.status });
      } catch (error) {
        // Mark as failed so it doesn't retry endlessly
        await db.campaign.update({
          where: { id: campaign.id },
          data: { status: "failed", completedAt: new Date() },
        });
        results.push({
          id: campaign.id,
          name: campaign.name,
          status: "failed",
          error: "Campaign execution failed",
        });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return apiSensitiveError(error);
  }
}
