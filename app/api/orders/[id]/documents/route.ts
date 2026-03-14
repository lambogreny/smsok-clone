import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { ensureOrderDocument } from "@/lib/orders/api";
import { serializeOrderDocument } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const createDocumentSchema = z.object({
  type: z.enum(["invoice", "tax_invoice", "receipt", "credit_note"]),
});

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "invoice_create");
    if (rl.blocked) return rl.blocked;

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

    const document = await db.$transaction(async (tx) => {
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
