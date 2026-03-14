import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { orderSummarySelect } from "@/lib/orders/api";
import { parseLegacyOrderStatus, serializeOrder } from "@/lib/orders/service";

const listSchema = z.object({
  status: z.enum([
    "PENDING",
    "SLIP_UPLOADED",
    "VERIFIED",
    "PENDING_REVIEW",
    "APPROVED",
    "COMPLETED",
    "EXPIRED",
    "CANCELLED",
    "REJECTED",
  ]).optional(),
  search: z.string().trim().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/admin/orders — admin order review list
export async function GET(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req);
    await db.order.updateMany({
      where: {
        status: { in: ["DRAFT", "PENDING_PAYMENT"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const input = listSchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const where: Record<string, unknown> = {};

    if (input.status) {
      const mappedStatuses = parseLegacyOrderStatus(input.status);
      if (mappedStatuses?.length) {
        where.status = { in: mappedStatuses };
      }
    }

    if (input.from || input.to) {
      where.createdAt = {
        ...(input.from ? { gte: new Date(`${input.from}T00:00:00.000Z`) } : {}),
        ...(input.to ? { lte: new Date(`${input.to}T23:59:59.999Z`) } : {}),
      };
    }

    if (input.search) {
      where.OR = [
        { orderNumber: { contains: input.search, mode: "insensitive" } },
        { packageName: { contains: input.search, mode: "insensitive" } },
        { taxName: { contains: input.search, mode: "insensitive" } },
        { taxId: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [orders, total, pending, pendingReview, completed, revenue] = await Promise.all([
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
          ...where,
          status: { in: ["DRAFT", "PENDING_PAYMENT"] },
        },
      }),
      db.order.count({
        where: {
          ...where,
          status: "VERIFYING",
        },
      }),
      db.order.count({
        where: {
          ...where,
          status: "PAID",
        },
      }),
      db.order.aggregate({
        where: {
          ...where,
          status: "PAID",
        },
        _sum: { payAmount: true },
      }),
    ]);

    return apiResponse({
      orders: orders.map(serializeOrder),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: total === 0 ? 1 : Math.ceil(total / input.limit),
      },
      stats: {
        total,
        pending,
        pending_review: pendingReview,
        completed,
        revenue: revenue._sum.payAmount?.toNumber() ?? 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
