import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import {
  getPaymentTableColumns,
  hasPaymentColumn,
  pickPaymentAmountSumField,
} from "@/lib/payments/db-compat";
// GET /api/payments/stats — user's payment stats for billing page
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const paymentColumns = await getPaymentTableColumns() as Set<string>;
    const totalPaidSumField = pickPaymentAmountSumField(paymentColumns);

    if (totalPaidSumField === "totalAmount") {
      const [totalPaid, invoiceCount, pendingCount, totalPayments] = await Promise.all([
        db.payment.aggregate({
          where: { userId: session.id, status: "COMPLETED" },
          _sum: { totalAmount: true },
        }),
        hasPaymentColumn(paymentColumns, "invoice_number")
          ? db.payment.count({
              where: { userId: session.id, invoiceNumber: { not: null } },
            })
          : Promise.resolve(0),
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
    }

    const [totalPaid, invoiceCount, pendingCount, totalPayments] = await Promise.all([
      db.payment.aggregate({
        where: { userId: session.id, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      hasPaymentColumn(paymentColumns, "invoice_number")
        ? db.payment.count({
            where: { userId: session.id, invoiceNumber: { not: null } },
          })
        : Promise.resolve(0),
      db.payment.count({
        where: { userId: session.id, status: { in: ["PENDING", "PROCESSING", "PENDING_REVIEW"] } },
      }),
      db.payment.count({
        where: { userId: session.id },
      }),
    ]);

    return apiResponse({
      totalPaid: totalPaid._sum.amount ?? 0,
      invoiceCount,
      pendingCount,
      totalPayments,
    });
  } catch (error) {
    return apiError(error);
  }
}
