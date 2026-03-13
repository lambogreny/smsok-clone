import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { renderOrderAccountingDocumentPdf } from "@/lib/orders/pdf";
import { applyRateLimit } from "@/lib/rate-limit";
import { orderPdfSelect } from "@/lib/orders/api";

type RouteContext = {
  params: Promise<{ id: string; type: string }>;
};

const TYPE_MAP = {
  invoice: "INVOICE",
  "tax-invoice": "TAX_INVOICE",
  receipt: "RECEIPT",
  "credit-note": "CREDIT_NOTE",
} as const;

const PDF_TYPE_BY_DOCUMENT = {
  INVOICE: "INVOICE",
  TAX_INVOICE: "TAX_INVOICE",
  RECEIPT: "RECEIPT",
  CREDIT_NOTE: "CREDIT_NOTE",
} as const;

// GET /api/v1/orders/:id/documents/:type — download latest order document by type
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "invoice_pdf");
    if (rl.blocked) return rl.blocked;

    const { id, type } = await ctx.params;
    const documentType = TYPE_MAP[type as keyof typeof TYPE_MAP];
    if (!documentType) {
      throw new ApiError(404, "ไม่พบประเภทเอกสาร");
    }

    const document = await db.orderDocument.findFirst({
      where: {
        orderId: id,
        type: documentType,
        deletedAt: null,
        order: { userId: session.id },
      },
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        type: true,
        documentNumber: true,
        issuedAt: true,
        order: {
          select: orderPdfSelect,
        },
      },
    });
    if (!document) throw new ApiError(404, "ไม่พบเอกสาร");

    const pdfBuffer = await renderOrderAccountingDocumentPdf(document.order, {
      documentNumber: document.documentNumber,
      type: PDF_TYPE_BY_DOCUMENT[document.type],
      issuedAt: document.issuedAt,
    });
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        ...rl.headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${document.documentNumber}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
