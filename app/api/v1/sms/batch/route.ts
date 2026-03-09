import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { sendBatchSms } from "@/lib/actions/sms";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendBatchSmsApiSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "batch");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const input = sendBatchSmsApiSchema.parse(body);
    const result = await sendBatchSms(user.id, {
      senderName: input.sender,
      recipients: input.to,
      message: input.message,
    });

    return apiResponse({
      total_messages: result.totalMessages,
      credits_used: result.totalCredits,
      credits_remaining: user.credits - result.totalCredits,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
