import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { resolveStoredFileUrl } from "@/lib/storage/files";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/payments/:id — payment detail + EasySlip data
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);
    const { id } = await ctx.params;

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        vatAmount: true,
        totalAmount: true,
        currency: true,
        method: true,
        status: true,
        slipUrl: true,
        slipFileName: true,
        slipFileSize: true,
        easyslipVerified: true,
        easyslipResponse: true,
        easyslipAmount: true,
        easyslipBank: true,
        easyslipDate: true,
        adminNote: true,
        rejectReason: true,
        reviewedBy: true,
        reviewedAt: true,
        invoiceNumber: true,
        invoiceUrl: true,
        refundAmount: true,
        refundedAt: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        packageTier: { select: { id: true, name: true, tierCode: true, totalSms: true, price: true } },
        history: {
          select: { id: true, fromStatus: true, toStatus: true, changedBy: true, note: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");

    return apiResponse({
      ...payment,
      slipUrl: resolveStoredFileUrl(payment.slipUrl),
    });
  } catch (error) {
    return apiError(error);
  }
}
