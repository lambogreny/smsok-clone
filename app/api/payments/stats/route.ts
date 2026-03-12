import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/payments/stats — user's payment stats for billing page
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "api");
    if (rl.blocked) return rl.blocked;

    const [totalPaid, invoiceCount, pendingCount, totalPayments] = await Promise.all([
      db.payment.aggregate({
        where: { userId: session.id, status: "COMPLETED" },
        _sum: { totalAmount: true },
      }),
      db.payment.count({
        where: { userId: session.id, invoiceNumber: { not: null } },
      }),
      db.payment.count({
        where: { userId: session.id, status: { in: ["PENDING", "PROCESSING", "PENDING_REVIEW"] } },
      }),
      db.payment.count({
        where: { userId: session.id },
      }),
    ]);

    return apiResponse({
      totalPaid: totalPaid._sum.totalAmount ?? 0,
      invoiceCount,
      pendingCount,
      totalPayments,
    });
  } catch (error) {
    return apiError(error);
  }
}
