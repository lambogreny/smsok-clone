import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getProfile, updateProfile } from "@/lib/actions/settings";
import { prisma } from "@/lib/db";
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

// PATCH /api/v1/settings/profile — update avatar
export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : null;
    // Use raw SQL since Prisma client may not yet reflect the new avatar_url column
    await prisma.$executeRaw`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${user.id}`;
    return apiResponse({ id: user.id, avatarUrl });
  } catch (error) {
    return apiError(error);
  }
}
