import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import {
  ensurePaymentDocumentNumber,
  renderPaymentDocumentPdf,
  type PaymentDocumentRecord,
} from "@/lib/payments/documents";
import { applyRateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/payments/:id/credit-note — download refund credit note PDF
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "invoice_pdf");
    if (rl.blocked) return rl.blocked;

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
        createdAt: true,
        paidAt: true,
        refundedAt: true,
        expiresAt: true,
        amount: true,
        vatAmount: true,
        totalAmount: true,
        hasWht: true,
        whtAmount: true,
        netPayAmount: true,
        preInvoiceNumber: true,
        invoiceNumber: true,
        creditNoteNumber: true,
        creditNoteUrl: true,
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
        packageTier: {
          select: {
            name: true,
            tierCode: true,
            totalSms: true,
          },
        },
      },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");
    if (payment.userId !== session.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");
    if (payment.status !== "REFUNDED") {
      throw new ApiError(400, "ใบลดหนี้จะออกได้เมื่อรายการนี้ถูกคืนเงินแล้ว");
    }

    const creditNoteNumber =
      payment.creditNoteNumber ?? (await ensurePaymentDocumentNumber(id, "credit-note"));
    const downloadUrl = `/api/payments/${id}/credit-note?download=1`;
    if (payment.creditNoteUrl !== downloadUrl) {
      await db.payment.update({
        where: { id },
        data: {
          creditNoteUrl: downloadUrl,
          creditNoteNumber,
        },
      });
    }

    if (!wantsPdf) {
      return apiResponse({
        id: payment.id,
        creditNoteNumber,
        creditNoteUrl: downloadUrl,
        status: payment.status,
        refundedAt: payment.refundedAt,
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        vatAmount: payment.vatAmount,
        totalAmount: payment.totalAmount,
      });
    }

    const pdfBuffer = await renderPaymentDocumentPdf(
      {
        ...(payment as PaymentDocumentRecord),
        creditNoteNumber,
      },
      "credit-note",
      creditNoteNumber,
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${creditNoteNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
