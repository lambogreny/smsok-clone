import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/settings/2fa — get 2FA status
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);

    const tfa = await prisma.twoFactorAuth.findUnique({
      where: { userId: user.id },
      select: {
        enabled: true,
        createdAt: true,
        recoveryCodes: true,
      },
    });

    return apiResponse({
      enabled: tfa?.enabled ?? false,
      setupAt: tfa?.createdAt ?? null,
      remainingRecoveryCodes: tfa ? tfa.recoveryCodes.filter((c: string) => c !== "").length : 0,
    });
  } catch (error) {
    return apiError(error);
  }
}
