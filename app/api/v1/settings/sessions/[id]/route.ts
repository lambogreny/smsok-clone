import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { revokeUserSession, verifyOrRefreshSession } from "@/lib/auth";
type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/v1/settings/sessions/:id — revoke specific session
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const result = await verifyOrRefreshSession({ headers: req.headers });
    if (!result) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;
    if (id === result.user.sessionId) {
      throw new ApiError(400, "ไม่สามารถเพิกถอน session ปัจจุบัน ใช้ logout แทน");
    }

    const revoked = await revokeUserSession(result.user.id, id);
    if (!revoked) throw new ApiError(404, "ไม่พบ session");

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
