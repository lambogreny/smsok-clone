import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import {
  cancelScheduledCampaign,
  reschedule,
  rescheduleCampaignInputSchema,
} from "@/lib/actions/scheduling";
import { readJsonOr400 } from "@/lib/read-json-or-400";

// PATCH /api/v1/campaigns/schedule/:id — reschedule a campaign
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await authenticateRequest(req);

    const denied = await requireApiPermission(session.id, "update", "campaign");
    if (denied) return denied;

    const { id } = await params;
    const body = await readJsonOr400(req);
    const parsed = rescheduleCampaignInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
    }

    const result = await reschedule(session.id, id, parsed.data.scheduledAt);
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
    const session = await authenticateRequest(_req);

    const denied = await requireApiPermission(session.id, "delete", "campaign");
    if (denied) return denied;

    const { id } = await params;
    const result = await cancelScheduledCampaign(session.id, id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
