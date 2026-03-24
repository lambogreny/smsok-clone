import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { ensureOrderDocument } from "@/lib/orders/api";
import { serializeOrderDocument } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const createDocumentSchema = z.object({
  type: z.enum(["invoice", "tax_invoice", "receipt", "credit_note"]),
});

const DOCUMENT_TYPE_DEFS = [
  { apiType: "invoice", dbType: "INVOICE", path: "invoice", label: "ใบแจ้งหนี้" },
  { apiType: "tax_invoice", dbType: "TAX_INVOICE", path: "tax-invoice", label: "ใบกำกับภาษี" },
  { apiType: "receipt", dbType: "RECEIPT", path: "receipt", label: "ใบเสร็จรับเงิน" },
  { apiType: "credit_note", dbType: "CREDIT_NOTE", path: "credit-note", label: "ใบลดหนี้" },
] as const;

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: {
        id: true,
        status: true,
        documents: {
          where: {
            deletedAt: null,
            type: { in: ["INVOICE", "TAX_INVOICE", "RECEIPT", "CREDIT_NOTE"] },
          },
          orderBy: { issuedAt: "desc" },
          select: {
            id: true,
            type: true,
            documentNumber: true,
            issuedAt: true,
            pdfUrl: true,
            voidedAt: true,
            voidReason: true,
          },
        },
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");

    const latestDocumentByType = new Map<string, typeof order.documents[number]>();
    for (const document of order.documents) {
      if (!latestDocumentByType.has(document.type)) {
        latestDocumentByType.set(document.type, document);
      }
    }

    const documents = DOCUMENT_TYPE_DEFS.map((definition) => {
      const document = latestDocumentByType.get(definition.dbType);
      return {
        type: definition.apiType,
        label: definition.label,
        available: Boolean(document),
        status: !document ? "unavailable" : document.voidedAt ? "voided" : "ready",
        document_id: document?.id ?? null,
        document_number: document?.documentNumber ?? null,
        issued_at: document?.issuedAt.toISOString() ?? null,
        voided_at: document?.voidedAt?.toISOString() ?? null,
        void_reason: document?.voidReason ?? null,
        url:
          document
            ? document.pdfUrl || `/api/v1/orders/${order.id}/documents/${definition.path}`
            : null,
      };
    });

    return apiResponse({
      order_id: order.id,
      order_status: order.status,
      documents,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const input = createDocumentSchema.parse(await req.json());
    const { id } = await ctx.params;

    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: {
        id: true,
        status: true,
        invoiceNumber: true,
        creditNoteNumber: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");

    if (input.type === "invoice" && order.status === "DRAFT") {
      throw new ApiError(400, "ยังสร้างใบแจ้งหนี้ไม่ได้จนกว่าจะยืนยันคำสั่งซื้อ");
    }
    if ((input.type === "tax_invoice" || input.type === "receipt") && order.status !== "PAID") {
      throw new ApiError(400, "เอกสารนี้ออกได้เมื่อคำสั่งซื้อชำระเงินแล้วเท่านั้น");
    }
    if (input.type === "credit_note") {
      if (order.status !== "CANCELLED") {
        throw new ApiError(400, "ใบลดหนี้ออกได้หลังยกเลิกคำสั่งซื้อเท่านั้น");
      }
      const hasIssuedDocument = await db.orderDocument.count({
        where: {
          orderId: order.id,
          type: { in: ["INVOICE", "TAX_INVOICE", "RECEIPT"] },
          deletedAt: null,
        },
      });
      if (hasIssuedDocument === 0) {
        throw new ApiError(400, "ยังไม่มีเอกสารอ้างอิงสำหรับออกใบลดหนี้");
      }
    }

    const document = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      switch (input.type) {
        case "invoice":
          return ensureOrderDocument(tx, order, "INVOICE");
        case "tax_invoice":
          return ensureOrderDocument(tx, order, "TAX_INVOICE");
        case "receipt":
          return ensureOrderDocument(tx, order, "RECEIPT");
        case "credit_note":
          return ensureOrderDocument(tx, order, "CREDIT_NOTE");
      }
    });

    return apiResponse(serializeOrderDocument(document as Parameters<typeof serializeOrderDocument>[0]));
  } catch (error) {
    return apiError(error);
  }
}
