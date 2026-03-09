import { NextRequest } from "next/server";
import { authenticateApiKey, ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { adminApproveSenderName, adminGetPendingSenderNames } from "@/lib/actions/sender-names";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

async function requireAdmin(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const limit = checkRateLimit(admin.id, "admin");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const pending = await adminGetPendingSenderNames();
    return apiResponse({ senders: pending });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    const limit = checkRateLimit(admin.id, "admin");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    await adminApproveSenderName(admin.id, body);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
