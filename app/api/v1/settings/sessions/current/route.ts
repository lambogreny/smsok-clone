import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { verifyOrRefreshSession } from "@/lib/auth";
// GET /api/v1/settings/sessions/current — get current session info
export async function GET(req: Request) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const current = result.session;

    return apiResponse({
      id: current.sessionId,
      deviceName: current.deviceName,
      deviceType: current.deviceType,
      browser: current.browser,
      os: current.os,
      ipAddress: current.ip,
      location: null,
      lastActiveAt: current.lastActiveAt,
      createdAt: current.createdAt,
      isCurrent: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
