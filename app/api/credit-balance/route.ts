import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
// GET /api/credit-balance — SMS quota summary + thresholds
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const now = new Date();
    const activePackages = await db.packagePurchase.findMany({
      where: { userId: session.id, isActive: true, expiresAt: { gt: now } },
      select: {
        id: true,
        smsTotal: true,
        smsUsed: true,
        expiresAt: true,
        tier: { select: { name: true, tierCode: true } },
      },
      orderBy: { expiresAt: "asc" },
    });

    const totalCredits = activePackages.reduce((sum: number, p: (typeof activePackages)[number]) => sum + p.smsTotal, 0);
    const usedCredits = activePackages.reduce((sum: number, p: (typeof activePackages)[number]) => sum + p.smsUsed, 0);
    const remainingCredits = totalCredits - usedCredits;
    const percentage = totalCredits > 0 ? Math.round((remainingCredits / totalCredits) * 100) : 0;

    // Determine alert threshold
    let threshold: string | null = null;
    if (percentage <= 5) threshold = "5%";
    else if (percentage <= 20) threshold = "20%";
    else if (percentage <= 50) threshold = "50%";

    const quotaSummary = {
      remaining_credits: remainingCredits,
      remaining_messages: remainingCredits,
      total_quota: totalCredits,
      used_quota: usedCredits,
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
      totalCredits,
      usedCredits,
      remainingCredits,
      percentage,
      threshold,
      packages: activePackages,
    });
  } catch (error) {
    return apiError(error);
  }
}
