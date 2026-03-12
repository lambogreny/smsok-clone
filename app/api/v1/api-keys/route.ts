import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { createApiKey, getApiKeys } from "@/lib/actions/api-keys";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createApiKeySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const keys = await getApiKeys(user.id);
    return apiResponse({ apiKeys: keys });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);

    const limit = await checkRateLimit(user.id, "apikey");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const input = createApiKeySchema.parse(body);
    const apiKey = await createApiKey(user.id, input);
    return apiResponse(apiKey, 201);
  } catch (error) {
    return apiError(error);
  }
}
