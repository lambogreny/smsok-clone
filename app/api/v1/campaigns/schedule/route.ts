import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import {
  getScheduledCampaigns,
  scheduleCampaign,
  scheduleCampaignInputSchema,
} from "@/lib/actions/scheduling";
import { readJsonOr400 } from "@/lib/read-json-or-400";

// GET /api/v1/campaigns/schedule — list scheduled campaigns
export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);

    const denied = await requireApiPermission(session.id, "read", "campaign");
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    const result = await getScheduledCampaigns(session.id, page, limit);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/campaigns/schedule — schedule a new campaign
export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);

    const denied = await requireApiPermission(session.id, "create", "campaign");
    if (denied) return denied;

    const body = await readJsonOr400(req);
    const parsed = scheduleCampaignInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
    }

    const result = await scheduleCampaign(session.id, parsed.data);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
