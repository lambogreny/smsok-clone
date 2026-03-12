import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { setup2FA } from "@/lib/actions/two-factor";

// POST /api/v1/settings/2fa/enable — generate TOTP secret + QR code
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

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
