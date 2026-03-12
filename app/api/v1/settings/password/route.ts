import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { changePassword } from "@/lib/actions/settings";
import { clearSession } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validations";

// PUT /api/v1/settings/password — change password
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const limit = await checkRateLimit(user.id, "password");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const input = changePasswordSchema.parse(body);
    const result = await changePassword(user.id, input);
    await clearSession();
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
