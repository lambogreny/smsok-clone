import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { requireApiPermission } from "@/lib/rbac";
import { scheduleCampaign, getScheduledCampaigns } from "@/lib/actions/scheduling";

// GET /api/v1/campaigns/schedule — list scheduled campaigns
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

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
    const session = await getSession();
    if (!session) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const denied = await requireApiPermission(session.id, "create", "campaign");
    if (denied) return denied;

    const body = await req.json();
    const result = await scheduleCampaign(session.id, body);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
