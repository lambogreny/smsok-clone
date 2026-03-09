import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import {
  createScheduledSms,
  getScheduledSms,
  cancelScheduledSms,
} from "@/lib/actions/scheduled-sms";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { scheduledSmsCancelSchema, scheduledSmsCreateSchema } from "@/lib/validations";

// GET /api/v1/sms/scheduled — list scheduled messages
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const scheduled = await getScheduledSms(user.id);
    return apiResponse({ scheduled, total: scheduled.length });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/sms/scheduled — create or cancel scheduled message
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    // Cancel
    if (body.action === "cancel" && body.id) {
      const input = scheduledSmsCancelSchema.parse(body);
      const result = await cancelScheduledSms(user.id, input.id);
      return apiResponse(result);
    }

    // Create — rate limited
    const limit = checkRateLimit(user.id, "sms");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

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
