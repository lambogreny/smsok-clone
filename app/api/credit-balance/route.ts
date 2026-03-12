import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/credit-balance — SMS balance + thresholds
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "api");
    if (rl.blocked) return rl.blocked;

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

    const totalCredits = activePackages.reduce((sum, p) => sum + p.smsTotal, 0);
    const usedCredits = activePackages.reduce((sum, p) => sum + p.smsUsed, 0);
    const remainingCredits = totalCredits - usedCredits;
    const percentage = totalCredits > 0 ? Math.round((remainingCredits / totalCredits) * 100) : 0;

    // Determine alert threshold
    let threshold: string | null = null;
    if (percentage <= 5) threshold = "5%";
    else if (percentage <= 20) threshold = "20%";
    else if (percentage <= 50) threshold = "50%";

    return apiResponse({
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
