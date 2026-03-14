import { NextRequest } from "next/server";
import { type OrderStatus } from "@prisma/client";
import { z } from "zod";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { activateOrderPurchase, ensureOrderDocument, orderSummarySelect } from "@/lib/orders/api";
import { createOrderHistory, serializeOrderV2 } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const statusSchema = z.object({
  status: z.enum([
    "draft",
    "pending_payment",
    "verifying",
    "paid",
    "expired",
    "cancelled",
  ]),
  note: z.string().trim().max(1000).optional(),
});

const OWNER_ALLOWED_TARGETS = new Set(["cancelled"]);
const ADMIN_ALLOWED_TARGETS = new Set([
  "pending_payment",
  "verifying",
  // "paid" removed — use /api/admin/orders/[id]/approve instead (requires slip verification)
  "expired",
  "cancelled",
]);

const STATUS_FROM_API = {
  draft: "DRAFT",
  pending_payment: "PENDING_PAYMENT",
  verifying: "VERIFYING",
  paid: "PAID",
  expired: "EXPIRED",
  cancelled: "CANCELLED",
} as const;

const ALLOWED_TRANSITIONS: Record<OrderStatus, ReadonlySet<OrderStatus>> = {
  DRAFT: new Set<OrderStatus>(["PENDING_PAYMENT", "CANCELLED", "EXPIRED"]),
  PENDING_PAYMENT: new Set<OrderStatus>(["VERIFYING", "PAID", "EXPIRED", "CANCELLED"]),
  VERIFYING: new Set<OrderStatus>(["PAID", "CANCELLED"]),
  PAID: new Set<OrderStatus>(["CANCELLED"]),
  EXPIRED: new Set<OrderStatus>([]),
  CANCELLED: new Set<OrderStatus>([]),
};

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    let admin = null;

    try {
      admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);
    } catch {
      admin = null;
    }

    if (!session?.id && !admin) {
      throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    }

    const input = statusSchema.parse(await req.json());
    const nextStatus = STATUS_FROM_API[input.status];
    const { id } = await ctx.params;

    const order = await db.order.findFirst({
      where: admin ? { id } : { id, userId: session!.id },
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

    const isAdmin = Boolean(admin);
    if (!isAdmin && !OWNER_ALLOWED_TARGETS.has(input.status)) {
      throw new ApiError(403, "ผู้ใช้ทั่วไปเปลี่ยนสถานะนี้ไม่ได้");
    }
    if (isAdmin && !ADMIN_ALLOWED_TARGETS.has(input.status)) {
      throw new ApiError(403, "สถานะนี้ไม่อนุญาตสำหรับ admin");
    }
    if (!ALLOWED_TRANSITIONS[order.status].has(nextStatus)) {
      throw new ApiError(400, "ไม่สามารถเปลี่ยนสถานะตามลำดับนี้ได้");
    }

    const actorId = admin?.id ?? session!.id;
    const note = input.note?.trim() || null;

    const updated = await db.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          rejectReason: nextStatus === "PAID" ? null : undefined,
          rejectMessage: nextStatus === "PAID" ? null : undefined,
          rejectedAt: nextStatus === "PAID" ? null : undefined,
          paidAt: nextStatus === "PAID" ? new Date() : undefined,
          completedAt: nextStatus === "PAID" ? new Date() : undefined,
          cancelledAt: nextStatus === "CANCELLED" ? new Date() : undefined,
          cancellationReason: nextStatus === "CANCELLED" ? note ?? "Order cancelled" : undefined,
        },
        select: orderSummarySelect,
      });

      if (nextStatus === "PENDING_PAYMENT") {
        await ensureOrderDocument(tx, order, "INVOICE");
      }

      if (nextStatus === "PAID") {
        await activateOrderPurchase(tx, order);
        await ensureOrderDocument(tx, order, "TAX_INVOICE");
        await ensureOrderDocument(tx, order, "RECEIPT");
      }

      if (nextStatus === "CANCELLED") {
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
      }

      await createOrderHistory(tx, order.id, nextStatus, {
        fromStatus: order.status,
        changedBy: actorId,
        note:
          note ??
          (nextStatus === "PAID"
            ? "Order marked as paid"
            : nextStatus === "EXPIRED"
              ? "Order expired"
              : nextStatus === "CANCELLED"
                ? "Order cancelled"
                : `Order moved to ${input.status}`),
      });

      return next;
    });

    return apiResponse(serializeOrderV2(updated));
  } catch (error) {
    return apiError(error);
  }
}
