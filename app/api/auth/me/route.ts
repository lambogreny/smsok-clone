import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { verifyOrRefreshSession } from "@/lib/auth";

// GET /api/auth/me — current authenticated user (kept for compatibility)
export async function GET(req: Request) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) {
      throw new ApiError(401, "Session ถูกเพิกถอนหรือหมดอายุ");
    }

    return apiResponse({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      organizationId: result.user.organizationId,
      sessionId: result.user.sessionId,
      refreshed: result.refreshed,
    });
  } catch (error) {
    return apiError(error);
  }
}
