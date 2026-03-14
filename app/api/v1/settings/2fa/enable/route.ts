import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { setup2FA } from "@/lib/actions/two-factor";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/v1/settings/2fa/enable — generate TOTP secret + QR code
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const rl = await applyRateLimit(session.id, "auth");
    if (rl.blocked) return rl.blocked;

    const result = await setup2FA();
    return apiResponse({
      qrCode: result.qrCode,
      secret: result.secret,
      recoveryCodes: result.recoveryCodes,
    });
  } catch (error) {
    return apiError(error);
  }
}
