import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { clearSession, verifyOrRefreshSession } from "@/lib/auth";

// GET /api/auth/verify-session — validate current session, refresh if needed
export async function GET(req: Request) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) {
      await clearSession();
      throw new ApiError(401, "Session ถูกเพิกถอนหรือหมดอายุ");
    }

    return apiResponse({
      authenticated: true,
      refreshed: result.refreshed,
      sessionId: result.user.sessionId,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        organizationId: result.user.organizationId,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
