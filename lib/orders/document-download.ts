import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { renderOrderQuotationPdf } from "@/lib/orders/pdf";
import { renderOrderAccountingDocumentPdf } from "@/lib/orders/pdf";
import { orderPdfSelect } from "@/lib/orders/api";
import { readStoredFile } from "@/lib/storage/service";

const TYPE_MAP = {
  quotation: "QUOTATION",
  invoice: "INVOICE",
  "tax-invoice": "TAX_INVOICE",
  tax_invoice: "TAX_INVOICE",
  receipt: "RECEIPT",
  "credit-note": "CREDIT_NOTE",
  credit_note: "CREDIT_NOTE",
} as const;

const PDF_TYPE_BY_DOCUMENT = {
  INVOICE: "INVOICE",
  TAX_INVOICE: "TAX_INVOICE",
  RECEIPT: "RECEIPT",
  CREDIT_NOTE: "CREDIT_NOTE",
} as const;

export async function buildOrderDocumentDownloadResponse(
  req: NextRequest,
  params: { id: string; type: string },
) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const documentType = TYPE_MAP[params.type as keyof typeof TYPE_MAP];
    if (!documentType) {
      throw new ApiError(404, "ไม่พบประเภทเอกสาร");
    }

    const order = await db.order.findFirst({
      where: { id: params.id, userId: session.id },
      select: {
        ...orderPdfSelect,
        status: true,
        quotationNumber: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");

    const download = req.nextUrl.searchParams.get("download") === "1";
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");

    if (documentType === "QUOTATION") {
      if (!order.quotationNumber) {
        throw new ApiError(404, "ไม่พบใบเสนอราคา");
      }

      const pdfBuffer = await renderOrderQuotationPdf(order);
      headers.set(
        "Content-Disposition",
        `${download ? "attachment" : "inline"}; filename="${order.quotationNumber}.pdf"`,
      );
      headers.set("Content-Length", String(pdfBuffer.length));

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers,
      });
    }

    if ((documentType === "TAX_INVOICE" || documentType === "RECEIPT") && order.status !== "PAID") {
      throw new ApiError(400, "กรุณาชำระเงินก่อน");
    }

    const document = await db.orderDocument.findFirst({
      where: {
        orderId: params.id,
        type: documentType,
        deletedAt: null,
      },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        documentNumber: true,
        issuedAt: true,
        pdfUrl: true,
      },
    });
    if (!document) throw new ApiError(404, "ไม่พบเอกสาร");

    if (document.pdfUrl?.startsWith("r2:")) {
      const file = await readStoredFile(document.pdfUrl);
      headers.set(
        "Content-Disposition",
        `${download ? "attachment" : "inline"}; filename="${document.documentNumber}.pdf"`,
      );
      headers.set("Content-Length", String(file.contentLength));

      return new NextResponse(new Uint8Array(file.body), {
        headers,
      });
    }

    const pdfBuffer = await renderOrderAccountingDocumentPdf(order, {
      documentNumber: document.documentNumber,
      type: PDF_TYPE_BY_DOCUMENT[document.type],
      issuedAt: document.issuedAt,
    });
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="${document.documentNumber}.pdf"`,
    );
    headers.set("Content-Length", String(pdfBuffer.length));

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers,
    });
  } catch (error) {
    return apiError(error);
  }
}
