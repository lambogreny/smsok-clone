import { NextRequest } from "next/server";
import { authenticateRequest, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { sendSms } from "@/lib/actions/sms";
import { sendSmsApiSchema } from "@/lib/validations";
import { getRemainingQuota } from "@/lib/package/quota";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "sms");
    if (denied) return denied;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const input = sendSmsApiSchema.parse(body);
    const message = await sendSms(user.id, {
      senderName: input.sender,
      recipient: input.to,
      message: input.message,
    }, "API");

    if ("error" in message && message.error === "INSUFFICIENT_CREDITS") {
      return Response.json(message, { status: 402 });
    }

    const msg = message as { id: string; status: string; creditCost: number };
    const quota = await getRemainingQuota(user.id);

    return apiResponse({
      id: msg.id,
      status: msg.status,
      sms_used: msg.creditCost,
      sms_remaining: quota.totalRemaining,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
