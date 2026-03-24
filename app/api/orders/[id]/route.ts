import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { orderDetailSelect } from "@/lib/orders/api";
import {
  serializeOrderDocument,
  serializeOrderSlip,
  serializeOrderStatus,
  serializeOrderV2,
} from "@/lib/orders/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const { id } = await ctx.params;

    await db.order.updateMany({
      where: {
        id,
        userId: session.id,
        status: { in: ["DRAFT", "PENDING_PAYMENT"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const order = await db.order.findFirst({
      where: { id, userId: session.id },
      select: orderDetailSelect,
    });
    if (!order) throw new ApiError(404, "ไม่พบคำสั่งซื้อ");

    return apiResponse({
      ...serializeOrderV2(order),
      documents: order.documents.map(serializeOrderDocument),
      slips: order.slips.map(serializeOrderSlip),
      history: order.history.map((item: (typeof order.history)[number]) => ({
        id: item.id,
        from_status: item.fromStatus ? serializeOrderStatus(item.fromStatus) : null,
        to_status: serializeOrderStatus(item.toStatus),
        changed_by: item.changedBy ?? undefined,
        note: item.note ?? undefined,
        created_at: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
