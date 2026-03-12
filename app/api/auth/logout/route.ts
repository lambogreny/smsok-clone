import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { ERROR_CODES } from "@/lib/api-log";
import { logoutCurrentSession } from "@/lib/auth";
import { hasValidCsrfOrigin } from "@/lib/csrf";

// POST /api/auth/logout — revoke current Redis session + denylist current AT + clear cookies
export async function POST(req: Request) {
  try {
    if (!hasValidCsrfOrigin(req)) {
      throw new ApiError(403, "CSRF: invalid origin", ERROR_CODES.FORBIDDEN);
    }

    await logoutCurrentSession();
    return apiResponse({ success: true, loggedOut: true });
  } catch (error) {
    return apiError(error);
  }
}
