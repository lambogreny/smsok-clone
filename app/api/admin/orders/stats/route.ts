import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
// GET /api/admin/orders/stats — summary cards for admin order dashboard
export async function GET(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req);
    await db.order.updateMany({
      where: {
        status: { in: ["DRAFT", "PENDING_PAYMENT"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const [total, pending, pendingReview, completed, revenue] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: { in: ["DRAFT", "PENDING_PAYMENT"] } } }),
      db.order.count({ where: { status: "VERIFYING" } }),
      db.order.count({ where: { status: "PAID" } }),
      db.order.aggregate({
        where: { status: "PAID" },
        _sum: { payAmount: true },
      }),
    ]);

    return apiResponse({
      stats: {
        total,
        pending,
        pending_review: pendingReview,
        completed,
        revenue: revenue._sum.payAmount?.toNumber() ?? 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
