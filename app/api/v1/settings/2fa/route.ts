import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { get2FAStatus } from "@/lib/actions/two-factor";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/v1/settings/2fa — get 2FA status
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const rl = await applyRateLimit(session.id, "api");
    if (rl.blocked) return rl.blocked;

    return apiResponse(await get2FAStatus());
  } catch (error) {
    return apiError(error);
  }
}
