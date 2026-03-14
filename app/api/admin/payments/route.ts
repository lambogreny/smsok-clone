import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  method: z.string().optional(),
  search: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z.enum(["newest", "oldest", "amount_asc", "amount_desc"]).default("newest"),
});

// GET /api/admin/payments — list all payments (filterable)
export async function GET(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const { page, limit, status, method, search, from, to, sort } = querySchema.parse(params);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (method) where.method = method;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy = sort === "oldest" ? { createdAt: "asc" as const }
      : sort === "amount_asc" ? { totalAmount: "asc" as const }
      : sort === "amount_desc" ? { totalAmount: "desc" as const }
      : { createdAt: "desc" as const };

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        select: {
          id: true,
          amount: true,
          vatAmount: true,
          totalAmount: true,
          method: true,
          status: true,
          easyslipVerified: true,
          invoiceNumber: true,
          paidAt: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          packageTier: { select: { name: true, tierCode: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);

    return apiResponse({
      payments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
