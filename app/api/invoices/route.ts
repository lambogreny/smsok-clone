import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { ensurePaymentDocumentNumber } from "@/lib/payments/documents";
// GET /api/invoices — invoice list backed by payments table
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)));

    const where: NonNullable<Parameters<typeof db.payment.findMany>[0]>["where"] = {
      userId: session.id,
      status: { in: ["COMPLETED", "REFUNDED"] },
    };

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          createdAt: true,
          paidAt: true,
          amount: true,
          vatAmount: true,
          totalAmount: true,
          invoiceNumber: true,
          invoiceUrl: true,
        },
      }),
      db.payment.count({ where }),
    ]);

    const invoices = [];
    for (const payment of payments) {
      const invoiceNumber =
        payment.invoiceNumber ??
        (await ensurePaymentDocumentNumber(payment.id, "invoice"));

      invoices.push({
        id: payment.id,
        invoiceNumber,
        createdAt: payment.paidAt ?? payment.createdAt,
        subtotal: payment.amount / 100,
        vatAmount: (payment.vatAmount ?? 0) / 100,
        total: (payment.totalAmount ?? 0) / 100,
        status: payment.status === "COMPLETED" ? "PAID" : "VOIDED",
        downloadUrl: invoiceNumber ? `/api/payments/${payment.id}/invoice?download=1` : null,
      });
    }

    return apiResponse({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
