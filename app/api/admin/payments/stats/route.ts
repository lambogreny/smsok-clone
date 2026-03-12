import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/admin/payments/stats — payment statistics
export async function GET(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);

    const rl = await applyRateLimit(admin.id, "admin");
    if (rl.blocked) return rl.blocked;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalPayments,
      pendingCount,
      pendingReviewCount,
      completedCount,
      failedCount,
      refundedCount,
      todayRevenue,
      monthRevenue,
      todayCount,
    ] = await Promise.all([
      db.payment.count(),
      db.payment.count({ where: { status: "PENDING" } }),
      db.payment.count({ where: { status: "PENDING_REVIEW" } }),
      db.payment.count({ where: { status: "COMPLETED" } }),
      db.payment.count({ where: { status: "FAILED" } }),
      db.payment.count({ where: { status: "REFUNDED" } }),
      db.payment.aggregate({
        where: { status: "COMPLETED", paidAt: { gte: startOfDay } },
        _sum: { totalAmount: true },
      }),
      db.payment.aggregate({
        where: { status: "COMPLETED", paidAt: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      db.payment.count({ where: { createdAt: { gte: startOfDay } } }),
    ]);

    return apiResponse({
      totalPayments,
      todayCount,
      byStatus: {
        pending: pendingCount,
        pendingReview: pendingReviewCount,
        completed: completedCount,
        failed: failedCount,
        refunded: refundedCount,
      },
      revenue: {
        today: todayRevenue._sum.totalAmount ?? 0,
        month: monthRevenue._sum.totalAmount ?? 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
