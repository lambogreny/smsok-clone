import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/payments/:id/timeline — payment status history
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);

    const rl = await applyRateLimit(admin.id, "admin");
    if (rl.blocked) return rl.blocked;

    const { id } = await ctx.params;

    const payment = await db.payment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");

    const timeline = await db.paymentHistory.findMany({
      where: { paymentId: id },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        changedBy: true,
        note: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiResponse({ paymentId: id, timeline });
  } catch (error) {
    return apiError(error);
  }
}
