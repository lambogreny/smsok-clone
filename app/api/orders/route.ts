import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { orderSummarySelect } from "@/lib/orders/api";
import { parseOrderStatus, serializeOrderV2 } from "@/lib/orders/service";

export { POST } from "@/app/api/v1/orders/route";

const listSchema = z.object({
  status: z.enum([
    "draft",
    "pending_payment",
    "verifying",
    "paid",
    "expired",
    "cancelled",
  ]).optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    await db.order.updateMany({
      where: {
        userId: session.id,
        status: { in: ["DRAFT", "PENDING_PAYMENT"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const input = listSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = { userId: session.id };
    const mappedStatuses = parseOrderStatus(input.status);

    if (mappedStatuses?.length) {
      where.status = { in: mappedStatuses };
    }

    if (input.date_from || input.date_to) {
      where.createdAt = {
        ...(input.date_from ? { gte: new Date(`${input.date_from}T00:00:00.000Z`) } : {}),
        ...(input.date_to ? { lte: new Date(`${input.date_to}T23:59:59.999Z`) } : {}),
      };
    }

    if (input.search) {
      where.OR = [
        { orderNumber: { contains: input.search, mode: "insensitive" } },
        { packageName: { contains: input.search, mode: "insensitive" } },
        { taxName: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [orders, total, pendingOrders, paidOrders, spent] = await Promise.all([
      db.order.findMany({
        where,
        select: orderSummarySelect,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.order.count({ where }),
      db.order.count({
        where: {
          userId: session.id,
          status: { in: ["DRAFT", "PENDING_PAYMENT", "VERIFYING"] },
        },
      }),
      db.order.count({ where: { userId: session.id, status: "PAID" } }),
      db.order.aggregate({
        where: { userId: session.id, status: "PAID" },
        _sum: { payAmount: true },
      }),
    ]);

    return apiResponse({
      orders: orders.map(serializeOrderV2),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / input.limit)),
      },
      stats: {
        total,
        pending: pendingOrders,
        paid: paidOrders,
        total_spent: spent._sum.payAmount?.toNumber() ?? 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
