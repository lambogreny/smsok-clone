import { NextRequest } from "next/server";
import { apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { scheduleCampaign } from "@/lib/actions/scheduling";
import { recurringSmsCreateSchema } from "@/lib/validations";
import { requireApiPermission } from "@/lib/rbac";
import { readJsonOr400 } from "@/lib/read-json-or-400";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const denied = await requireApiPermission(user.id, "create", "sms");
    if (denied) return denied;

    const body = await readJsonOr400(req);
    const input = recurringSmsCreateSchema.parse(body);
    const recipients = input.to ? [input.to] : input.recipients;

    const result = await scheduleCampaign(user.id, {
      name: input.name ?? "Recurring SMS",
      recipients,
      groupId: input.groupId,
      message: input.message,
      senderName: input.sender,
      scheduledAt: input.scheduledAt,
      timezone: input.timezone,
      recurring: input.recurring,
    });

    return apiResponse({ recurring: result }, 201);
  } catch (error) {
    return apiError(error);
  }
}
