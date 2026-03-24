import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
// GET /api/credits — package quota summary, usage, expiry, and purchase history
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const now = new Date();
    const [activePackages, packageHistory] = await Promise.all([
      db.packagePurchase.findMany({
        where: { userId: session.id, isActive: true, expiresAt: { gt: now } },
        select: {
          id: true,
          smsTotal: true,
          smsUsed: true,
          purchasedAt: true,
          expiresAt: true,
          tier: { select: { name: true, tierCode: true } },
        },
        orderBy: { expiresAt: "asc" },
      }),
      db.packagePurchase.findMany({
        where: { userId: session.id },
        select: {
          id: true,
          smsTotal: true,
          smsUsed: true,
          isActive: true,
          purchasedAt: true,
          expiresAt: true,
          tier: { select: { name: true, tierCode: true } },
        },
        orderBy: { purchasedAt: "desc" },
        take: 30,
      }),
    ]);

    const totalCredits = activePackages.reduce((sum: number, pkg: (typeof activePackages)[number]) => sum + pkg.smsTotal, 0);
    const usedCredits = activePackages.reduce((sum: number, pkg: (typeof activePackages)[number]) => sum + pkg.smsUsed, 0);
    const remainingCredits = totalCredits - usedCredits;
    const percentage =
      totalCredits > 0 ? Math.round((remainingCredits / totalCredits) * 100) : 0;

    let threshold: string | null = null;
    if (percentage <= 5) threshold = "5%";
    else if (percentage <= 20) threshold = "20%";
    else if (percentage <= 50) threshold = "50%";

    const quotaSummary = {
      total_quota: totalCredits,
      used_quota: usedCredits,
      remaining_credits: remainingCredits,
      remaining_messages: remainingCredits,
      percentage,
      threshold,
    };

    return apiResponse({
      remaining_credits: remainingCredits,
      remaining_messages: remainingCredits,
      total_quota: totalCredits,
      used_quota: usedCredits,
      quotaSummary,
      quota: quotaSummary,
      balance: {
        totalCredits,
        usedCredits,
        remainingCredits,
        percentage,
        threshold,
      },
      history: packageHistory.map((pkg: (typeof packageHistory)[number]) => ({
        id: pkg.id,
        packageName: pkg.tier.name,
        tierCode: pkg.tier.tierCode,
        smsTotal: pkg.smsTotal,
        smsUsed: pkg.smsUsed,
        smsRemaining: pkg.smsTotal - pkg.smsUsed,
        remaining_credits: pkg.smsTotal - pkg.smsUsed,
        purchasedAt: pkg.purchasedAt,
        expiresAt: pkg.expiresAt,
        status: pkg.isActive && pkg.expiresAt > now ? "ACTIVE" : "EXPIRED",
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
