import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { changePassword } from "@/lib/actions/settings";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// PUT /api/v1/settings/password — change password
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const limit = checkRateLimit(user.id, "password");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const result = await changePassword(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
