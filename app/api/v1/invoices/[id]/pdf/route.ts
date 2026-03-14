import { NextRequest } from "next/server";
import { ApiError, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import {
  ensurePaymentDocumentNumber,
  renderPaymentDocumentPdf,
  type PaymentDocumentRecord,
} from "@/lib/payments/documents";
type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/invoices/:id/pdf — generate and download PDF
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await ctx.params;
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
    if (payment.userId !== user.id) throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึง");
    if (payment.status !== "COMPLETED") {
      throw new ApiError(400, "ใบกำกับภาษีจะออกได้เมื่อชำระเงินสำเร็จ");
    }

    const invoiceNumber =
      payment.invoiceNumber ?? (await ensurePaymentDocumentNumber(id, "invoice"));
    const pdfBuffer = await renderPaymentDocumentPdf(
      {
        ...(payment as PaymentDocumentRecord),
        invoiceNumber,
      },
      "invoice",
      invoiceNumber,
    );
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invoiceNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
