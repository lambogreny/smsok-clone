import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getProfile, updateProfile } from "@/lib/actions/settings";

// GET /api/v1/settings/profile — get user profile
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const profile = await getProfile(user.id);
    return apiResponse(profile);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/profile — update profile (name)
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const result = await updateProfile(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
