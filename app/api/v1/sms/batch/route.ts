import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { sendBatchSms } from "@/lib/actions/sms";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    const result = await sendBatchSms(user.id, {
      senderName: body.sender || "EasySlip",
      recipients: body.to, // array of phone numbers
      message: body.message,
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
