import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/payments/:id — payment detail
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;

    const basePayment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!basePayment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");
    if (basePayment.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");

    if (
      basePayment.status === "PENDING" &&
      basePayment.expiresAt &&
      basePayment.expiresAt.getTime() <= Date.now()
    ) {
      await db.$transaction([
        db.payment.update({
          where: { id },
          data: { status: "EXPIRED" },
        }),
        db.paymentHistory.create({
          data: {
            paymentId: id,
            fromStatus: "PENDING",
            toStatus: "EXPIRED",
            changedBy: "system",
            note: "Payment expired after 24 hours",
          },
        }),
      ]);
    }

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        packageTierId: true,
        taxProfileId: true,
        amount: true,
        vatAmount: true,
        totalAmount: true,
        whtAmount: true,
        netPayAmount: true,
        hasWht: true,
        method: true,
        status: true,
        slipUrl: true,
        slipFileName: true,
        whtCertUrl: true,
        whtCertVerified: true,
        easyslipVerified: true,
        easyslipAmount: true,
        easyslipBank: true,
        easyslipDate: true,
        rejectReason: true,
        preInvoiceNumber: true,
        preInvoiceUrl: true,
        invoiceNumber: true,
        invoiceUrl: true,
        creditNoteNumber: true,
        creditNoteUrl: true,
        expiresAt: true,
        paidAt: true,
        refundedAt: true,
        createdAt: true,
        packageTier: {
          select: {
            name: true,
            tierCode: true,
            totalSms: true,
            bonusPercent: true,
            expiryMonths: true,
          },
        },
        taxProfile: {
          select: {
            companyName: true,
            taxId: true,
            address: true,
            branchType: true,
            branchNumber: true,
          },
        },
      },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");

    const { packageTier, ...data } = payment;
    return apiResponse({
      ...data,
      packageName: packageTier?.name ?? null,
      tierCode: packageTier?.tierCode ?? null,
      smsCredits: packageTier?.totalSms ?? 0,
      bonusPercent: packageTier?.bonusPercent ?? 0,
      expiryMonths: packageTier?.expiryMonths ?? 0,
      packageTier,
    });
  } catch (error) {
    return apiError(error);
  }
}
