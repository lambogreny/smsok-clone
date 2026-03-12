import { apiError, apiResponse } from "@/lib/api-auth";
import { logoutCurrentSession } from "@/lib/auth";

// POST /api/auth/logout — revoke current Redis session + denylist current AT + clear cookies
export async function POST() {
  try {
    await logoutCurrentSession();
    return apiResponse({ success: true, loggedOut: true });
  } catch (error) {
    return apiError(error);
  }
}
