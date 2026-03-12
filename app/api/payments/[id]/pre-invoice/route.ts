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

// GET /api/payments/:id/pre-invoice — download pre-payment invoice PDF
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
        preInvoiceUrl: true,
        invoiceNumber: true,
        creditNoteNumber: true,
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

    const preInvoiceNumber =
      payment.preInvoiceNumber ?? (await ensurePaymentDocumentNumber(id, "pre-invoice"));
    const downloadUrl = `/api/payments/${id}/pre-invoice?download=1`;
    if (payment.preInvoiceUrl !== downloadUrl) {
      await db.payment.update({
        where: { id },
        data: { preInvoiceUrl: downloadUrl },
      });
    }

    if (!wantsPdf) {
      return apiResponse({
        id: payment.id,
        preInvoiceNumber,
        preInvoiceUrl: downloadUrl,
        status: payment.status,
        expiresAt: payment.expiresAt,
        amount: payment.amount,
        vatAmount: payment.vatAmount,
        totalAmount: payment.totalAmount,
        whtAmount: payment.whtAmount,
        netPayAmount: payment.netPayAmount,
        createdAt: payment.createdAt,
        packageTier: payment.packageTier,
      });
    }

    const pdfBuffer = await renderPaymentDocumentPdf(
      {
        ...(payment as PaymentDocumentRecord),
        preInvoiceNumber,
      },
      "pre-invoice",
      preInvoiceNumber,
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${preInvoiceNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
