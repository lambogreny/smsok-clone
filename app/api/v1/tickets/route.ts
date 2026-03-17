import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ApiError, apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { enforceSupportTicketRateLimit } from "@/lib/tickets/rate-limit";
import { z } from "zod";

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "AWAITING_RESPONSE", "RESOLVED", "CLOSED"] as const;
const TICKET_CATEGORIES = ["BILLING", "TECHNICAL", "SENDER_NAME", "DELIVERY", "ACCOUNT", "GENERAL"] as const;
const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

type TicketStatus = (typeof TICKET_STATUSES)[number];
type TicketCategory = (typeof TICKET_CATEGORIES)[number];
type TicketPriority = (typeof TICKET_PRIORITIES)[number];

type TicketListRow = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
};

type TicketCountRow = {
  total: number;
};

type TicketReplyCountRow = {
  ticketId: string;
  replies: number;
};

const listSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES).default("MEDIUM"),
  pdpaConsent: z.boolean().refine((v) => v === true, { message: "กรุณายินยอมข้อกำหนด PDPA" }),
});

function normalizeTicketStatus(value: string): TicketStatus {
  const normalized = value.trim().toUpperCase();
  if (TICKET_STATUSES.includes(normalized as TicketStatus)) {
    return normalized as TicketStatus;
  }
  return "OPEN";
}

function normalizeTicketCategory(value: string): TicketCategory {
  const normalized = value.trim().toUpperCase();
  if (TICKET_CATEGORIES.includes(normalized as TicketCategory)) {
    return normalized as TicketCategory;
  }
  return "GENERAL";
}

function normalizeTicketPriority(value: string): TicketPriority {
  const normalized = value.trim().toUpperCase();
  if (TICKET_PRIORITIES.includes(normalized as TicketPriority)) {
    return normalized as TicketPriority;
  }
  return "MEDIUM";
}

// GET /api/v1/tickets — list user's tickets
export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = listSchema.parse(params);

    const filters: Prisma.Sql[] = [Prisma.sql`st.user_id = ${session.id}`];
    if (input.status) {
      filters.push(Prisma.sql`UPPER(st.status::text) = ${input.status}`);
    }
    if (input.category) {
      filters.push(Prisma.sql`UPPER(st.category::text) = ${input.category}`);
    }
    if (input.search) {
      const query = `%${input.search}%`;
      filters.push(
        Prisma.sql`(st.subject ILIKE ${query} OR st.description ILIKE ${query})`,
      );
    }
    const whereCondition = filters.reduce<Prisma.Sql | null>((acc, filter) => {
      if (!acc) return filter;
      return Prisma.sql`${acc} AND ${filter}`;
    }, null);
    const whereClause = whereCondition
      ? Prisma.sql`WHERE ${whereCondition}`
      : Prisma.empty;

    const [tickets, countRows] = await Promise.all([
      db.$queryRaw<TicketListRow[]>(Prisma.sql`
        SELECT
          st.id,
          st.subject,
          st.description,
          st.status::text AS status,
          st.priority::text AS priority,
          st.category::text AS category,
          st.created_at AS "createdAt",
          st.updated_at AS "updatedAt"
        FROM support_tickets st
        ${whereClause}
        ORDER BY st.updated_at DESC
        LIMIT ${input.limit}
        OFFSET ${(input.page - 1) * input.limit}
      `),
      db.$queryRaw<TicketCountRow[]>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM support_tickets st
        ${whereClause}
      `),
    ]);
    const total = countRows[0]?.total ?? 0;

    let replyCounts = new Map<string, number>();
    if (tickets.length > 0) {
      try {
        const replyRows = await db.$queryRaw<TicketReplyCountRow[]>(Prisma.sql`
          SELECT
            tr.ticket_id AS "ticketId",
            COUNT(*)::int AS replies
          FROM ticket_replies tr
          WHERE tr.ticket_id IN (${Prisma.join(tickets.map((ticket) => ticket.id))})
          GROUP BY tr.ticket_id
        `);
        replyCounts = new Map(
          replyRows.map((row) => [row.ticketId, row.replies]),
        );
      } catch (error) {
        logger.warn("Support ticket reply counts unavailable", {
          ticketCount: tickets.length,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return apiResponse({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: normalizeTicketStatus(ticket.status),
        priority: normalizeTicketPriority(ticket.priority),
        category: normalizeTicketCategory(ticket.category),
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        _count: { replies: replyCounts.get(ticket.id) ?? 0 },
      })),
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
    await enforceSupportTicketRateLimit(req.headers, session.id, "create");
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
