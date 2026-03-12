import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getProfile, updateProfile } from "@/lib/actions/settings";

// GET /api/v1/settings/profile — get user profile
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const profile = await getProfile(user.id);
    return apiResponse(profile);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/profile — update profile (name)
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const result = await updateProfile(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
