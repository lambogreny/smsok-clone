import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { getRemainingQuota } from "@/lib/package/quota";
// GET /api/credits/balance — normalized remaining-quota endpoint for send/otp UIs
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const quota = await getRemainingQuota(session.id);
    const expiry = quota.packages[0]?.expiresAt ?? null;

    const quotaSummary = {
      remaining_credits: quota.totalRemaining,
      remaining_messages: quota.totalRemaining,
      total_quota: quota.totalSms,
      used_quota: quota.totalUsed,
      expiry,
    };

    return apiResponse({
      remaining_credits: quota.totalRemaining,
      remaining_messages: quota.totalRemaining,
      total_quota: quota.totalSms,
      used_quota: quota.totalUsed,
      quotaSummary,
      quota: quotaSummary,
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
