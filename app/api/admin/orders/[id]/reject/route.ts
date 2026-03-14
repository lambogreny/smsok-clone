import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { ensureOrderDocument, orderSummarySelect } from "@/lib/orders/api";
import { createOrderHistory, serializeOrder } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const rejectSchema = z.object({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผล").max(500),
});

// POST /api/admin/orders/:id/reject — reject payment review
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const { reason } = rejectSchema.parse(body);
    const reviewRejectReason = reason.length <= 30 ? reason : "ADMIN_REJECTED";

    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        invoiceNumber: true,
        creditNoteNumber: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (!["VERIFYING", "PENDING_PAYMENT"].includes(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่อยู่ในสถานะที่ปฏิเสธได้");
    }

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason,
          // legacy admin review semantics: rejectReason: reason
          rejectReason: reviewRejectReason,
          rejectMessage: reason,
          rejectedAt: new Date(),
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
        select: orderSummarySelect,
      });

      const hasIssuedDocument = await tx.orderDocument.count({
        where: {
          orderId: order.id,
          type: { in: ["INVOICE", "TAX_INVOICE", "RECEIPT"] },
          deletedAt: null,
        },
      });
      if (hasIssuedDocument > 0) {
        await ensureOrderDocument(tx, order, "CREDIT_NOTE");
      }

      await createOrderHistory(tx, order.id, "CANCELLED", {
        fromStatus: order.status,
        changedBy: admin.id,
        note: `Order rejected: ${reason}`,
      });

      return next;
    });

    return apiResponse({ order: serializeOrder(updated) });
  } catch (error) {
    return apiError(error);
  }
}
