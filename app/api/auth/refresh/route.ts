import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { ERROR_CODES } from "@/lib/api-log";
import { refreshSession } from "@/lib/auth";
import { hasValidCsrfOrigin } from "@/lib/csrf";

// POST /api/auth/refresh — refresh AT + rotate RT
export async function POST(req: Request) {
  try {
    if (!hasValidCsrfOrigin(req)) {
      throw new ApiError(403, "CSRF: invalid origin", ERROR_CODES.FORBIDDEN);
    }

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
