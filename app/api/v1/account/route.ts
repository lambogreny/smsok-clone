import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getProfile, updateProfile, changePassword } from "@/lib/actions/settings";
import { clearSession } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const profile = await getProfile(user.id);
    return apiResponse(profile);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();

    if (body.currentPassword) {
      // Stricter rate limit for password changes
      const limit = await checkRateLimit(user.id, "password");
      if (!limit.allowed) return rateLimitResponse(limit.resetIn);

      const input = changePasswordSchema.parse(body);
      const result = await changePassword(user.id, input);
      await clearSession();
      return apiResponse(result);
    }

    const input = updateProfileSchema.parse(body);
    const updated = await updateProfile(user.id, input);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
