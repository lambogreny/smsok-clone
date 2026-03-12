
import { prisma as db } from "../db";
import { Prisma, TicketCategory } from "@prisma/client";
import { z } from "zod";

// ── Schemas ────────────────────────────────────────────

const createTicketSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  subject: z.string().min(1, "กรุณากรอกหัวข้อ").max(200),
  description: z.string().min(1, "กรุณากรอกรายละเอียด"),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  category: z.string().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  assigneeId: z.string().nullable().optional(),
  category: z.string().optional(),
});

const replySchema = z.object({
  content: z.string().min(1, "กรุณากรอกข้อความ"),
  isInternal: z.boolean().optional(),
});

const kbSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().optional(),
  published: z.boolean().optional(),
});

const smsAdjustSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(1).max(500),
});

// ── Support Metrics ────────────────────────────────────

export async function getSupportMetrics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    openTickets,
    inProgressTickets,
    resolvedThisMonth,
    allResolved,
  ] = await Promise.all([
    db.supportTicket.count({ where: { status: "OPEN" } }),
    db.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    db.supportTicket.findMany({
      where: { status: { in: ["RESOLVED", "CLOSED"] }, resolvedAt: { gte: monthStart } },
      select: { createdAt: true, firstReplyAt: true, resolvedAt: true },
    }),
    db.supportTicket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
  ]);

  // Calculate avg response time & resolution time
  let totalResponseMs = 0;
  let totalResolutionMs = 0;
  let responseCount = 0;
  let resolutionCount = 0;

  for (const t of resolvedThisMonth) {
    if (t.firstReplyAt) {
      totalResponseMs += t.firstReplyAt.getTime() - t.createdAt.getTime();
      responseCount++;
    }
    if (t.resolvedAt) {
      totalResolutionMs += t.resolvedAt.getTime() - t.createdAt.getTime();
      resolutionCount++;
    }
  }

  const avgResponseMinutes = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 60000) : 0;
  const avgResolutionMinutes = resolutionCount > 0 ? Math.round(totalResolutionMs / resolutionCount / 60000) : 0;

  const totalTickets = openTickets + inProgressTickets + allResolved;
  const slaCompliance = totalTickets > 0 ? ((allResolved / totalTickets) * 100).toFixed(1) : "100.0";

  return {
    openTickets,
    inProgressTickets,
    resolvedThisMonth: resolvedThisMonth.length,
    avgResponseMinutes,
    avgResolutionMinutes,
    slaCompliance: parseFloat(slaCompliance),
  };
}

// ── Ticket CRUD ────────────────────────────────────────

export async function getTickets(options: {
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
} = {}) {
  const { status, priority, category, assigneeId, page = 1, limit = 20 } = options;

  const where: Prisma.SupportTicketWhereInput = {};
  if (status) where.status = status as Prisma.EnumTicketStatusFilter;
  if (priority) where.priority = priority as Prisma.EnumTicketPriorityFilter;
  if (category) where.category = category as Prisma.EnumTicketCategoryFilter;
  if (assigneeId) where.assigneeId = assigneeId;

  const [tickets, total] = await Promise.all([
    db.supportTicket.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        _count: { select: { replies: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.supportTicket.count({ where }),
  ]);

  return { tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createTicket(data: unknown) {
  const parsed = createTicketSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");

  return db.supportTicket.create({
    data: {
      userId: parsed.data.userId,
      organizationId: parsed.data.organizationId,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority ?? "MEDIUM",
      category: (parsed.data.category ?? "GENERAL") as TicketCategory,
    },
  });
}

export async function updateTicket(ticketId: string, data: unknown) {
  const parsed = updateTicketSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");

  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("ไม่พบ ticket");

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") {
      updateData.resolvedAt = new Date();
    }
  }
  if (parsed.data.priority) updateData.priority = parsed.data.priority;
  if (parsed.data.assigneeId !== undefined) updateData.assigneeId = parsed.data.assigneeId;
  if (parsed.data.category) updateData.category = parsed.data.category;

  return db.supportTicket.update({ where: { id: ticketId }, data: updateData });
}

export async function getTicketDetail(ticketId: string) {
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      assignee: { select: { id: true, name: true } },
      replies: {
        include: { admin: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) throw new Error("ไม่พบ ticket");
  return ticket;
}

// ── Ticket Reply ───────────────────────────────────────

export async function replyToTicket(adminId: string, ticketId: string, data: unknown) {
  const parsed = replySchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");

  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("ไม่พบ ticket");

  const reply = await db.ticketReply.create({
    data: {
      ticketId,
      adminId,
      content: parsed.data.content,
      isInternal: parsed.data.isInternal ?? false,
    },
  });

  // Update first reply time if not set
  if (!ticket.firstReplyAt) {
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { firstReplyAt: new Date(), status: "IN_PROGRESS" },
    });
  }

  return reply;
}

export async function escalateTicket(adminId: string, ticketId: string) {
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("ไม่พบ ticket");

  const result = await db.$transaction(async (tx) => {
    const escalated = await tx.supportTicket.update({
      where: { id: ticketId },
      data: { priority: "URGENT", category: "TECHNICAL" },
    });

    await tx.ticketReply.create({
      data: {
        ticketId,
        adminId,
        content: "[System] Ticket escalated to dev team",
        isInternal: true,
      },
    });

    return escalated;
  });

  return result;
}

// ── Knowledge Base ─────────────────────────────────────

export async function getKBArticles(options: { category?: string; published?: boolean; page?: number; limit?: number } = {}) {
  const { category, published, page = 1, limit = 20 } = options;
  const where: Prisma.KnowledgeBaseWhereInput = {};
  if (category) where.category = category;
  if (published !== undefined) where.published = published;

  const [articles, total] = await Promise.all([
    db.knowledgeBase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.knowledgeBase.count({ where }),
  ]);
  return { articles, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createKBArticle(data: unknown) {
  const parsed = kbSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");

  const slug = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100) + "-" + Date.now().toString(36);

  return db.knowledgeBase.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      category: (parsed.data.category ?? "GENERAL") as TicketCategory,
      published: parsed.data.published ?? false,
      slug,
    },
  });
}

export async function updateKBArticle(articleId: string, data: unknown) {
  const parsed = kbSchema.partial().safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");

  const article = await db.knowledgeBase.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("ไม่พบบทความ");

  return db.knowledgeBase.update({ where: { id: articleId }, data: parsed.data });
}

export async function deleteKBArticle(articleId: string) {
  await db.knowledgeBase.delete({ where: { id: articleId } });
}

export async function getKBAnalytics() {
  const topSearched = await db.knowledgeBase.findMany({
    where: { published: true },
    orderBy: { searchCount: "desc" },
    take: 20,
    select: { id: true, title: true, category: true, searchCount: true },
  });
  const totalArticles = await db.knowledgeBase.count();
  const publishedArticles = await db.knowledgeBase.count({ where: { published: true } });

  return { topSearched, totalArticles, publishedArticles };
}

// ── Customer Actions ───────────────────────────────────

export async function adjustCustomerSms(adminId: string, userId: string, data: unknown) {
  const parsed = smsAdjustSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");

  // Find user's first active package to add SMS to
  const activePackage = await db.packagePurchase.findFirst({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
  });

  if (!activePackage) {
    throw new Error("ผู้ใช้ไม่มี package ที่ใช้งานอยู่");
  }

  await db.packagePurchase.update({
    where: { id: activePackage.id },
    data: { smsTotal: { increment: parsed.data.amount } },
  });

  const remaining = (activePackage.smsTotal + parsed.data.amount) - activePackage.smsUsed;

  return { userId, smsAdded: parsed.data.amount, smsRemaining: remaining };
}

export async function suspendCustomer(adminId: string, userId: string, suspend: boolean) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("ไม่พบผู้ใช้");

  // Use role field: "suspended" vs "user"
  await db.user.update({
    where: { id: userId },
    data: { role: suspend ? "suspended" : "user" },
  });

  return { userId, suspended: suspend };
}
