import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { requireApiPermission } from "@/lib/rbac";
import { reschedule, cancelScheduledCampaign } from "@/lib/actions/scheduling";

// PATCH /api/v1/campaigns/schedule/:id — reschedule a campaign
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const denied = await requireApiPermission(session.id, "update", "campaign");
    if (denied) return denied;

    const { id } = await params;
    const body = await req.json();

    if (!body.scheduledAt) {
      return apiError(new Error("กรุณาระบุ scheduledAt"));
    }

    const result = await reschedule(session.id, id, body.scheduledAt);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/campaigns/schedule/:id — cancel a scheduled campaign
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const denied = await requireApiPermission(session.id, "delete", "campaign");
    if (denied) return denied;

    const { id } = await params;
    const result = await cancelScheduledCampaign(session.id, id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
