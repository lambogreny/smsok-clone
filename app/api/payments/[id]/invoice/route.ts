import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import {
  ensurePaymentDocumentNumber,
  renderPaymentDocumentPdf,
  type PaymentDocumentRecord,
} from "@/lib/payments/documents";
type Ctx = { params: Promise<{ id: string }> };

// GET /api/payments/:id/invoice — download invoice info
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const wantsPdf =
      searchParams.get("download") === "1" ||
      req.headers.get("accept")?.includes("application/pdf") === true;

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
        hasWht: true,
        amount: true,
        vatAmount: true,
        totalAmount: true,
        whtAmount: true,
        netPayAmount: true,
        refundedAt: true,
        invoiceNumber: true,
        invoiceUrl: true,
        preInvoiceNumber: true,
        creditNoteNumber: true,
        paidAt: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
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
        packageTier: { select: { name: true, tierCode: true, totalSms: true } },
        createdAt: true,
      },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");
    if (payment.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");
    if (payment.status !== "COMPLETED") throw new ApiError(400, "ใบกำกับภาษีจะออกได้เมื่อชำระเงินสำเร็จ");

    const invoiceNumber = payment.invoiceNumber ?? (await ensurePaymentDocumentNumber(id, "invoice"));
    const downloadUrl = `/api/payments/${id}/invoice?download=1`;
    if (payment.invoiceUrl !== downloadUrl) {
      await db.payment.update({
        where: { id },
        data: { invoiceUrl: downloadUrl },
      });
    }

    if (!wantsPdf) {
      return apiResponse({
        id: payment.id,
        invoiceNumber,
        invoiceUrl: downloadUrl,
        status: payment.status,
        amount: payment.amount,
        vatAmount: payment.vatAmount,
        totalAmount: payment.totalAmount,
        whtAmount: payment.whtAmount,
        netPayAmount: payment.netPayAmount,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        packageTier: payment.packageTier,
      });
    }

    const pdfBuffer = await renderPaymentDocumentPdf(
      {
        ...(payment as PaymentDocumentRecord),
        invoiceNumber,
      },
      "invoice",
      invoiceNumber,
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoiceNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
