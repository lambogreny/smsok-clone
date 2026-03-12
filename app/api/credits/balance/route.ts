import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { getRemainingQuota } from "@/lib/package/quota";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/credits/balance — normalized balance endpoint for send/otp UIs
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "api");
    if (rl.blocked) return rl.blocked;

    const quota = await getRemainingQuota(session.id);
    const expiry = quota.packages[0]?.expiresAt ?? null;

    return apiResponse({
      balance: quota.totalRemaining,
      smsRemaining: quota.totalRemaining,
      remaining: quota.totalRemaining,
      totalCredits: quota.totalSms,
      usedCredits: quota.totalUsed,
      expiry,
      packages: quota.packages.map((pkg) => ({
        id: pkg.id,
        smsTotal: pkg.smsTotal,
        smsUsed: pkg.smsUsed,
        smsRemaining: pkg.smsTotal - pkg.smsUsed,
        expiresAt: pkg.expiresAt,
        tierCode: pkg.tier.tierCode,
        packageName: pkg.tier.name,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
