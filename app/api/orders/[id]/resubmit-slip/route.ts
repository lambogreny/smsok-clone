import { Prisma } from "@prisma/client";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { orderSummarySelect } from "@/lib/orders/api";
import { MAX_SLIP_ATTEMPTS } from "@/lib/orders/rejected-slip";
import { applyRateLimit } from "@/lib/rate-limit";
import { createOrderHistory, serializeOrderV2 } from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "slip");
    if (rl.blocked) return rl.blocked;

    const { id } = await ctx.params;
    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        rejectReason: true,
        rejectMessage: true,
        rejectedAt: true,
        slipAttemptCount: true,
        easyslipVerified: true,
        easyslipResponse: true,
        adminNote: true,
        paidAt: true,
        completedAt: true,
      },
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
    if (order.status !== "PENDING_PAYMENT") {
      throw new ApiError(400, "คำสั่งซื้อนี้ยังไม่พร้อมให้ส่งสลิปใหม่");
    }
    if (order.expiresAt <= new Date()) {
      throw new ApiError(400, "คำสั่งซื้อนี้หมดอายุแล้ว");
    }
    if (!order.rejectReason && !order.rejectMessage && !order.rejectedAt) {
      throw new ApiError(400, "คำสั่งซื้อนี้ยังไม่ได้ถูกปฏิเสธสลิป");
    }
    if (order.slipAttemptCount >= MAX_SLIP_ATTEMPTS) {
      throw new ApiError(429, "คุณส่งสลิปผิดเกินจำนวนครั้งที่กำหนดแล้ว กรุณาติดต่อเจ้าหน้าที่");
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: order.id,
          status: "PENDING_PAYMENT",
          rejectReason: { not: null },
        },
        data: {
          status: "PENDING_PAYMENT",
          easyslipVerified: false,
          easyslipResponse: Prisma.JsonNull,
          adminNote: null,
          rejectReason: null,
          rejectMessage: null,
          rejectedAt: null,
          paidAt: null,
          completedAt: null,
        },
      });

      if (result.count !== 1) {
        throw new ApiError(409, "order status changed");
      }

      await createOrderHistory(tx, order.id, "PENDING_PAYMENT", {
        fromStatus: order.status,
        changedBy: session.id,
        note: "Customer requested to resubmit slip",
      });

      const next = await tx.order.findUnique({
        where: { id: order.id },
        select: orderSummarySelect,
      });
      if (!next) {
        throw new ApiError(404, "ไม่พบคำสั่งซื้อ");
      }

      return next;
    });

    return apiResponse(serializeOrderV2(updated));
  } catch (error) {
    return apiError(error);
  }
}
