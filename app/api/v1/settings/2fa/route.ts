import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { get2FAStatus } from "@/lib/actions/two-factor";

// GET /api/v1/settings/2fa — get 2FA status
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    return apiResponse(await get2FAStatus());
  } catch (error) {
    return apiError(error);
  }
}
