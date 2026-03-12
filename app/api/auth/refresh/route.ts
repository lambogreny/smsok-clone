import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { refreshSession } from "@/lib/auth";

// POST /api/auth/refresh — refresh AT + rotate RT
export async function POST(req: Request) {
  try {
    const result = await refreshSession({ headers: req.headers });
    if (!result) {
      throw new ApiError(401, "Refresh token ไม่ถูกต้องหรือหมดอายุ");
    }

    return apiResponse({
      success: true,
      refreshed: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        organizationId: result.user.organizationId,
      },
      sessionId: result.user.sessionId,
    });
  } catch (error) {
    return apiError(error);
  }
}
