import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { requestSenderName, getSenderNames } from "@/lib/actions/sender-names";
import { requestSenderNameSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const input = requestSenderNameSchema.parse(body);
    const sender = await requestSenderName(user.id, input);
    return apiResponse(sender, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const senders = await getSenderNames(user.id);
    return apiResponse({ senders });
  } catch (error) {
    return apiError(error);
  }
}
