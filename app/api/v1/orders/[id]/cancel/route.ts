import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { orderSummarySelect } from "@/lib/orders/api";
import { createOrderHistory, serializeOrder } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const cancellableStatuses = new Set(["DRAFT", "PENDING_PAYMENT", "VERIFYING"]);

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: user.id },
      select: { id: true, status: true },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (!cancellableStatuses.has(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่สามารถยกเลิกได้");
    }

    const body = await req.json().catch(() => ({}));
    const cancellationReason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : "Customer cancelled order";

    const updated = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const next = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason,
        },
        select: orderSummarySelect,
      });
      await createOrderHistory(tx, order.id, "CANCELLED", {
        fromStatus: order.status,
        changedBy: user.id,
        note: cancellationReason,
      });
      return next;
    });

    return apiResponse(serializeOrder(updated));
  } catch (error) {
    return apiError(error);
  }
}
