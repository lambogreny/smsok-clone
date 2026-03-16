import { NextRequest } from "next/server";
import { apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { cancelScheduledSms } from "@/lib/actions/scheduled-sms";
import { requireApiPermission } from "@/lib/rbac";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await authenticateRequest(req);
    const denied = await requireApiPermission(user.id, "delete", "sms");
    if (denied) return denied;

    const { id } = await params;
    const result = await cancelScheduledSms(user.id, id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
