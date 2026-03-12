import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { sendBatchSms } from "@/lib/actions/sms";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendBatchSmsApiSchema } from "@/lib/validations";
import { getRemainingQuota } from "@/lib/package/quota";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "sms");
    if (denied) return denied;

    const limit = await checkRateLimit(user.id, "batch");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const input = sendBatchSmsApiSchema.parse(body);
    const result = await sendBatchSms(user.id, {
      senderName: input.sender,
      recipients: input.to,
      message: input.message,
    }, "API");

    if ("error" in result && result.error === "INSUFFICIENT_CREDITS") {
      return Response.json(result, { status: 402 });
    }

    const batch = result as { totalMessages: number; totalSms: number };
    const quota = await getRemainingQuota(user.id);

    return apiResponse({
      total_messages: batch.totalMessages,
      sms_used: batch.totalSms,
      sms_remaining: quota.totalRemaining,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
