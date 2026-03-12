import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getMessages, getMessageStatus } from "@/lib/actions/sms";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);

    // Single message lookup
    const messageId = searchParams.get("id");
    if (messageId) {
      const message = await getMessageStatus(user.id, messageId);
      return apiResponse(message);
    }

    // List with filters
    const filters = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      channel: searchParams.get("channel") || undefined,
      senderName: searchParams.get("sender") || undefined,
      search: searchParams.get("search") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
    };

    const result = await getMessages(user.id, filters);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
