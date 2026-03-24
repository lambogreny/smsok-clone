import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { orderSummarySelect } from "@/lib/orders/api";
import { createOrderHistory, serializeOrderV2 } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const expirableStatuses = new Set(["DRAFT", "PENDING_PAYMENT"]);

// PATCH /api/orders/:id/expire — mark an overdue order as expired
export async function PATCH(_req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (!expirableStatuses.has(order.status)) {
      throw new ApiError(400, "คำสั่งซื้อนี้ไม่สามารถหมดอายุได้");
    }
    if (order.expiresAt > new Date()) {
      throw new ApiError(400, "คำสั่งซื้อยังไม่หมดอายุ");
    }

    const updated = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const next = await tx.order.update({
        where: { id: order.id },
        data: { status: "EXPIRED" },
        select: orderSummarySelect,
      });

      await createOrderHistory(tx, order.id, "EXPIRED", {
        fromStatus: order.status,
        changedBy: session.id,
        note: "Order expired after pending payment window elapsed",
      });

      return next;
    });

    return apiResponse(serializeOrderV2(updated));
  } catch (error) {
    return apiError(error);
  }
}
