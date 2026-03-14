import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import {
  createScheduledSms,
  getScheduledSms,
  cancelScheduledSms,
} from "@/lib/actions/scheduled-sms";
import { scheduledSmsCancelSchema, scheduledSmsCreateSchema } from "@/lib/validations";

// GET /api/v1/sms/scheduled — list scheduled messages
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "sms");
    if (denied) return denied;

    const scheduled = await getScheduledSms(user.id);
    return apiResponse({ scheduled, total: scheduled.length });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/sms/scheduled — create or cancel scheduled message
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "sms");
    if (denied) return denied;

    const body = await req.json();

    // Cancel
    if (body.action === "cancel" && body.id) {
      const input = scheduledSmsCancelSchema.parse(body);
      const result = await cancelScheduledSms(user.id, input.id);
      return apiResponse(result);
    }

    // Create
    const input = scheduledSmsCreateSchema.parse(body);
    const result = await createScheduledSms(user.id, {
      senderName: input.sender,
      recipient: input.to,
      message: input.message,
      scheduledAt: input.scheduledAt,
    });
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
