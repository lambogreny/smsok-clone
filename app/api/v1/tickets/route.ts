import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const listSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"]).optional(),
  category: z.enum(["BILLING", "TECHNICAL", "SENDER_NAME", "DELIVERY", "ACCOUNT", "GENERAL"]).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(["BILLING", "TECHNICAL", "SENDER_NAME", "DELIVERY", "ACCOUNT", "GENERAL"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  pdpaConsent: z.boolean().refine((v) => v === true, { message: "กรุณายินยอมข้อกำหนด PDPA" }),
});

// GET /api/v1/tickets — list user's tickets
export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = listSchema.parse(params);

    const where: Record<string, unknown> = { userId: session.id };
    if (input.status) where.status = input.status;
    if (input.category) where.category = input.category;
    if (input.search) {
      where.OR = [
        { subject: { contains: input.search, mode: "insensitive" } },
        { description: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        select: {
          id: true,
          subject: true,
          description: true,
          status: true,
          priority: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          closedAt: true,
          _count: { select: { replies: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.supportTicket.count({ where }),
    ]);

    return apiResponse({
      tickets,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/tickets — create ticket
export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const input = createSchema.parse(await req.json());

    const ticket = await db.supportTicket.create({
      data: {
        userId: session.id,
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: "OPEN",
      },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        category: true,
        createdAt: true,
      },
    });

    return apiResponse(ticket, 201);
  } catch (error) {
    return apiError(error);
  }
}
