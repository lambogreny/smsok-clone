import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { listUserSessions, verifyOrRefreshSession } from "@/lib/auth";

// GET /api/auth/sessions — list active sessions from Redis
export async function GET(req: Request) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) {
      throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    }

    const rl = await applyRateLimit(result.user.id, "api");
    if (rl.blocked) return rl.blocked;

    const sessions = await listUserSessions(result.user.id, result.user.sessionId);

    return apiResponse({ sessions });
  } catch (error) {
    return apiError(error);
  }
}
