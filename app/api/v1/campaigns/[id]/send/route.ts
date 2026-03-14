import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticateRequest } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { executeCampaign } from "@/lib/actions/campaigns";
// POST /api/v1/campaigns/:id/send — execute a campaign
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "campaign");
    if (denied) return denied;
    const { id } = await params;
    const result = await executeCampaign(user.id, id, undefined);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
