import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { checkSendingHours } from "@/lib/sending-hours";

// GET /api/v1/sending-hours — check current sending hours status (PDPA)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    // Try to get user's org for org-specific hours
    let orgId: string | undefined;
    if (session?.id) {
      const membership = await db.membership.findFirst({
        where: { userId: session.id },
        select: { organizationId: true },
      });
      orgId = membership?.organizationId ?? undefined;
    }

    const status = await checkSendingHours(orgId);
    return apiResponse({
      ...status,
      timezone: "Asia/Bangkok",
    });
  } catch (error) {
    return apiError(error);
  }
}
