import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { clearSession, revokeAllUserSessions, verifyOrRefreshSession } from "@/lib/auth";

// POST /api/auth/logout-all — revoke all sessions and bump security_version
export async function POST(req: Request) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) {
      throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    }

    const revoked = await revokeAllUserSessions(result.user.id, {
      incrementSecurityVersion: true,
    });
    await clearSession();

    return apiResponse({
      success: true,
      loggedOut: true,
      revoked,
    });
  } catch (error) {
    return apiError(error);
  }
}
