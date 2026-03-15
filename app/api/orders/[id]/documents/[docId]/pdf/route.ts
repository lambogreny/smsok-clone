import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { renderOrderAccountingDocumentPdf } from "@/lib/orders/pdf";
import { orderPdfSelect } from "@/lib/orders/api";
import { readStoredFile } from "@/lib/storage/service";

type RouteContext = {
  params: Promise<{ id: string; docId: string }>;
};

const PDF_TYPE_BY_DOCUMENT = {
  INVOICE: "INVOICE",
  TAX_INVOICE: "TAX_INVOICE",
  RECEIPT: "RECEIPT",
  CREDIT_NOTE: "CREDIT_NOTE",
} as const;

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id, docId } = await ctx.params;
    const document = await db.orderDocument.findFirst({
      where: {
        id: docId,
        orderId: id,
        deletedAt: null,
        order: { userId: session.id },
      },
      select: {
        id: true,
        type: true,
        documentNumber: true,
        verificationCode: true,
        issuedAt: true,
        pdfUrl: true,
        order: {
          select: orderPdfSelect,
        },
      },
    });
    if (!document) throw new ApiError(404, "ไม่พบเอกสาร");

    if (document.pdfUrl?.startsWith("r2:")) {
      const file = await readStoredFile(document.pdfUrl);
      const download = req.nextUrl.searchParams.get("download") === "1";

      return new Response(new Uint8Array(file.body), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${document.documentNumber}.pdf"`,
          "Content-Length": String(file.contentLength),
        },
      });
    }

    const pdfBuffer = await renderOrderAccountingDocumentPdf(document.order, {
      documentNumber: document.documentNumber,
      verificationCode: document.verificationCode,
      type: PDF_TYPE_BY_DOCUMENT[document.type],
      issuedAt: document.issuedAt,
    });
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${document.documentNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
