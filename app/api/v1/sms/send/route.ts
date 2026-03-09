import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { sendSms } from "@/lib/actions/sms";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    const message = await sendSms(user.id, {
      senderName: body.sender || "EasySlip",
      recipient: body.to,
      message: body.message,
    });

    return apiResponse({
      id: message.id,
      status: message.status,
      credits_used: message.creditCost,
      credits_remaining: user.credits - message.creditCost,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
