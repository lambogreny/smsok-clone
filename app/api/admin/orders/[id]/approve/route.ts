import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { activateOrderPurchase, ensureOrderDocument, orderSummarySelect } from "@/lib/orders/api";
import { createOrderHistory, serializeOrder } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/orders/:id/approve — approve payment review and activate package
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);

    const rl = await applyRateLimit(admin.id, "admin");
    if (rl.blocked) return rl.blocked;

    const { id } = await ctx.params;
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        packageTierId: true,
        smsCount: true,
        status: true,
        invoiceNumber: true,
        creditNoteNumber: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (!["VERIFYING", "PENDING_PAYMENT"].includes(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่อยู่ในสถานะที่อนุมัติได้");
    }

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          completedAt: new Date(),
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          rejectReason: null,
          rejectMessage: null,
          rejectedAt: null,
        },
        select: orderSummarySelect,
      });

      await activateOrderPurchase(tx, order);
      await ensureOrderDocument(tx, order, "TAX_INVOICE");
      await ensureOrderDocument(tx, order, "RECEIPT");

      await createOrderHistory(tx, order.id, "PAID", {
        fromStatus: order.status,
        changedBy: admin.id,
        note: `Order approved by ${admin.name}`,
      });

      return next;
    });

    return apiResponse({ order: serializeOrder(updated) });
  } catch (error) {
    return apiError(error);
  }
}
