import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { revokeUserSession, verifyOrRefreshSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ sid: string }>;
};

// DELETE /api/auth/sessions/:sid — revoke one device session
export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) {
      throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    }

    const rl = await applyRateLimit(result.user.id, "api");
    if (rl.blocked) return rl.blocked;

    const { sid } = await ctx.params;
    if (sid === result.user.sessionId) {
      throw new ApiError(400, "ไม่สามารถเพิกถอน session ปัจจุบัน ใช้ logout แทน");
    }

    const revoked = await revokeUserSession(result.user.id, sid);
    if (!revoked) {
      throw new ApiError(404, "ไม่พบ session");
    }

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
