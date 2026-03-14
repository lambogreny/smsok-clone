import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getProfile, updateProfile, changePassword } from "@/lib/actions/settings";
import { clearSession } from "@/lib/auth";
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
