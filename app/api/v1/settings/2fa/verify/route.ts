import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { enable2FA, regenerate2FARecoveryCodes, get2FAStatus } from "@/lib/actions/two-factor";
import { verify2FASchema } from "@/lib/validations";

// POST /api/v1/settings/2fa/verify — enable 2FA or regenerate backup codes
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const body = await req.json();
    const { code } = verify2FASchema.parse(body);

    const status = await get2FAStatus();
    const result = status.enabled
      ? await regenerate2FARecoveryCodes(code)
      : await enable2FA(code);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
