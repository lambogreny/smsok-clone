import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { requireApiPermission } from "@/lib/rbac";
import { getShortLinkStats } from "@/lib/link-shortener";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/links/:id/stats — click stats for a short link
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await authenticatePublicApiKey(req);

    const denied = await requireApiPermission(user.id, "read", "analytics");
    if (denied) return denied;

    const { id } = await ctx.params;
    const stats = await getShortLinkStats(user.id, id);
    return apiResponse(stats);
  } catch (error) {
    return apiError(error);
  }
}
