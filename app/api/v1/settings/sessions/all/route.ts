import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { revokeAllUserSessions, verifyOrRefreshSession } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";

// DELETE /api/v1/settings/sessions/all — revoke all sessions except current
export async function DELETE(req: Request) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(result.user.id, "api");
    if (rl.blocked) return rl.blocked;

    const revoked = await revokeAllUserSessions(result.user.id, {
      exceptSessionId: result.user.sessionId,
    });

    return apiResponse({ revoked });
  } catch (error) {
    return apiError(error);
  }
}
