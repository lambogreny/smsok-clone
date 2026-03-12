import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { requireApiPermission } from "@/lib/rbac";
import { executeCampaign } from "@/lib/actions/campaigns";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/v1/campaigns/:id/send — execute a campaign
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatePublicApiKey(req);

    const denied = await requireApiPermission(user.id, "create", "campaign");
    if (denied) return denied;

    const limit = await checkRateLimit(user.id, "batch");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const { id } = await params;
    const result = await executeCampaign(user.id, id, undefined);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
