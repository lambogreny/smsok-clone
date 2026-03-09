import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { importContacts } from "@/lib/actions/contacts";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "import");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();

    if (!Array.isArray(body.contacts)) {
      return apiResponse({ error: "contacts must be an array" }, 400);
    }

    const result = await importContacts(user.id, body.contacts);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
