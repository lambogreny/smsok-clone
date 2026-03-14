import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { regenerate2FARecoveryCodes } from "@/lib/actions/two-factor";
import { applyRateLimit } from "@/lib/rate-limit";
import { verify2FASchema } from "@/lib/validations";

// POST /api/v1/settings/2fa/regenerate-codes — verify TOTP code + replace backup codes
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const rl = await applyRateLimit(session.id, "auth");
    if (rl.blocked) return rl.blocked;

    const body = await req.json();
    const { code } = verify2FASchema.parse(body);

    return apiResponse(await regenerate2FARecoveryCodes(code));
  } catch (error) {
    return apiError(error);
  }
}
