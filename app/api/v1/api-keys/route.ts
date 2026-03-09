import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { createApiKey, getApiKeys } from "@/lib/actions/api-keys";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const keys = await getApiKeys(user.id);
    return apiResponse({ apiKeys: keys });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "apikey");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const apiKey = await createApiKey(user.id, body);
    return apiResponse(apiKey, 201);
  } catch (error) {
    return apiError(error);
  }
}
