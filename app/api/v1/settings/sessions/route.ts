import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { listUserSessions, verifyOrRefreshSession } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/v1/settings/sessions — list active sessions (Redis-backed)
export async function GET(req: Request) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(result.user.id, "api");
    if (rl.blocked) return rl.blocked;

    const sessions = await listUserSessions(result.user.id, result.user.sessionId);

    return apiResponse({ sessions });
  } catch (error) {
    return apiError(error);
  }
}
