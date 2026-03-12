"use server";

import { prisma as db } from "../db";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  sendSmsSchema,
  sendBatchSmsSchema,
  normalizePhone,
  reportFilterSchema,
} from "../validations";
import { sendSingleSms, sendSmsBatch } from "../sms-gateway";
import {
  deductQuota,
  refundQuota,
  refundQuotaIfEligible,
  calculateSmsSegments,
  ensureSufficientQuota,
} from "../package/quota";
import { assertSendingHours } from "../sending-hours";
import { checkAndAutoTopup } from "./auto-topup";
import { InsufficientCreditsError, toInsufficientCreditsResult } from "../quota-errors";
import type { InsufficientCreditsResult } from "../quota-errors";

// ==========================================
// Send single SMS
// ==========================================

export async function sendSms(userId: string, data: unknown, channel: "WEB" | "API" = "WEB", orgId?: string) {
  const parsed = sendSmsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const input = parsed.data;

  // PDPA: Block marketing SMS outside org-configured hours (WEB channel = marketing)
  // API channel may be transactional — caller handles enforcement
  if (channel === "WEB") {
    await assertSendingHours(orgId);
  }

  const smsCount = calculateSmsSegments(input.message);

  // Check package quota — return structured error (not throw) for server action boundary
  try {
    await ensureSufficientQuota(userId, smsCount);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return toInsufficientCreditsResult(err);
    throw err;
  }

  // Check sender name is approved
  const sender = await db.senderName.findFirst({
    where: { userId, name: input.senderName, status: "APPROVED" },
  });
  if (!sender && input.senderName !== "EasySlip") {
    throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  // Check SMS consent — respect opt-out (both legacy smsConsent and new consentStatus)
  const recipientPhone = normalizePhone(input.recipient);
  const recipientContact = await db.contact.findUnique({
    where: { userId_phone: { userId, phone: recipientPhone } },
    select: { smsConsent: true, consentStatus: true },
  });
  if (recipientContact && (!recipientContact.smsConsent || recipientContact.consentStatus === "OPTED_OUT")) {
    throw new Error("ผู้รับปฏิเสธการรับ SMS (opt-out) ไม่สามารถส่งได้");
  }

  // Create message + deduct package quota in transaction
  const { message, deductions } = await db.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    const createdMessage = await tx.message.create({
      data: {
        userId,
        channel,
        recipient: normalizePhone(input.recipient),
        content: input.message,
        senderName: input.senderName,
        creditCost: smsCount,
        status: "pending",
      },
    });

    const result = await deductQuota(tx, userId, smsCount);

    return {
      message: createdMessage,
      deductions: result.deductions,
    };
  });

  // Auto top-up check (fire-and-forget)
  checkAndAutoTopup(userId).catch((err) =>
    console.error("[auto-topup] check failed:", err),
  );

  // Send via EasyThunder SMS Gateway
  let gatewaySent = false;
  try {
    const result = await sendSingleSms(
      normalizePhone(input.recipient),
      input.message,
      input.senderName
    );

    if (result.success) {
      gatewaySent = true;

      // Mark message as "sent"
      await db.message.update({
        where: { id: message.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          gatewayId: result.jobId || null,
        },
      });
    } else {
      // Gateway returned failure — REFUND package quota
      await db.$transaction(async (tx) => {
        await tx.message.update({
          where: { id: message.id },
          data: { status: "failed", errorCode: result.error?.slice(0, 100) || null },
        });
        // Refund each package deduction
        for (const d of deductions) {
          await refundQuota(tx, d.purchaseId, d.amount);
        }
      });
      throw new Error(result.error || "ส่ง SMS ไม่สำเร็จ");
    }
  } catch (gatewayError) {
    // ONLY refund if SMS was NOT actually sent
    if (!gatewaySent) {
      const isAlreadyHandled = gatewayError instanceof Error && gatewayError.message.includes("ส่ง SMS ไม่สำเร็จ");
      if (!isAlreadyHandled) {
        await db.$transaction(async (tx) => {
          await tx.message.update({
            where: { id: message.id },
            data: { status: "failed" },
          });
          for (const d of deductions) {
            await refundQuota(tx, d.purchaseId, d.amount);
          }
        });
      }
    }
    throw gatewayError;
  }

  revalidatePath("/dashboard");
  return message;
}

// ==========================================
// Send batch SMS (creates multiple messages)
// ==========================================

export async function sendBatchSms(userId: string, data: unknown, channel: "WEB" | "API" = "WEB", orgId?: string) {
  const parsed = sendBatchSmsSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const input = parsed.data;

  // PDPA: Block marketing SMS outside org-configured hours (WEB channel = marketing)
  // API channel may be transactional — caller handles enforcement
  if (channel === "WEB") {
    await assertSendingHours(orgId);
  }

  const smsCount = calculateSmsSegments(input.message);
  const totalSms = smsCount * input.recipients.length;

  // Check package quota — return structured error (not throw) for server action boundary
  try {
    await ensureSufficientQuota(userId, totalSms);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return toInsufficientCreditsResult(err);
    throw err;
  }

  // Check sender name
  const sender = await db.senderName.findFirst({
    where: { userId, name: input.senderName, status: "APPROVED" },
  });
  if (!sender && input.senderName !== "EasySlip") {
    throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  // Create messages + deduct package quota
  const { result, batchDeductions } = await db.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    const created = await tx.message.createMany({
      data: input.recipients.map((phone) => ({
        userId,
        channel,
        recipient: normalizePhone(phone),
        content: input.message,
        senderName: input.senderName,
        creditCost: smsCount,
        status: "pending",
      })),
    });

    const quotaResult = await deductQuota(tx, userId, totalSms);

    return { result: created, batchDeductions: quotaResult.deductions };
  });

  // Auto top-up check (fire-and-forget)
  checkAndAutoTopup(userId).catch((err) =>
    console.error("[auto-topup] check failed:", err),
  );

  // Send via EasyThunder SMS Gateway (batches of 1000)
  const normalizedRecipients = input.recipients.map(normalizePhone);
  const batches: string[][] = [];
  for (let i = 0; i < normalizedRecipients.length; i += 1000) {
    batches.push(normalizedRecipients.slice(i, i + 1000));
  }

  let sentCount = 0;
  let failedCount = 0;
  const sentRecipients: string[] = [];
  const failedRecipients: string[] = [];

  for (const batch of batches) {
    try {
      const batchResult = await sendSmsBatch({
        recipients: batch,
        message: input.message,
        sender: input.senderName,
      });
      if (batchResult.success) {
        sentCount += batch.length;
        sentRecipients.push(...batch);
      } else {
        failedCount += batch.length;
        failedRecipients.push(...batch);
      }
    } catch {
      failedCount += batch.length;
      failedRecipients.push(...batch);
    }
  }

  // Update individual message statuses in DB
  if (sentRecipients.length > 0) {
    await db.message.updateMany({
      where: { userId, recipient: { in: sentRecipients }, status: "pending" },
      data: { status: "sent", sentAt: new Date() },
    });
  }
  if (failedRecipients.length > 0) {
    await db.message.updateMany({
      where: { userId, recipient: { in: failedRecipients }, status: "pending" },
      data: { status: "failed" },
    });
  }

  // Refund package quota for failed messages (tier D+ only for delivery failures)
  if (failedCount > 0) {
    const refundSms = smsCount * failedCount;
    let toRefund = refundSms;
    await db.$transaction(async (tx) => {
      for (let i = batchDeductions.length - 1; i >= 0 && toRefund > 0; i--) {
        const d = batchDeductions[i];
        const refundAmount = Math.min(d.amount, toRefund);
        await refundQuotaIfEligible(tx, d.purchaseId, refundAmount);
        toRefund -= refundAmount;
      }
    });
  }

  revalidatePath("/dashboard");
  return { totalMessages: result.count, totalSms, sentCount, failedCount };
}

// ==========================================
// Get message status
// ==========================================

export async function getMessageStatus(userId: string, messageId: string) {
  const message = await db.message.findFirst({
    where: { id: messageId, userId },
    select: {
      id: true,
      recipient: true,
      content: true,
      status: true,
      senderName: true,
      creditCost: true,
      sentAt: true,
      deliveredAt: true,
      createdAt: true,
    },
  });

  if (!message) throw new Error("ไม่พบข้อความ");
  return message;
}

// ==========================================
// Get messages report
// ==========================================

export async function getMessages(userId: string, filters: unknown) {
  const parsed = reportFilterSchema.safeParse(filters);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const input = parsed.data;
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { userId };
  if (input.status) where.status = input.status;
  if (input.type) where.type = input.type;
  if (input.channel) where.channel = input.channel;
  if (input.senderName) where.senderName = input.senderName;
  if (input.search) {
    where.OR = [
      { recipient: { contains: input.search } },
      { content: { contains: input.search } },
    ];
  }
  if (input.from || input.to) {
    where.createdAt = {
      ...(input.from && { gte: input.from }),
      ...(input.to && { lte: input.to }),
    };
  }

  // Base where without status filter for stats
  const statsWhere: Record<string, unknown> = { ...where };
  delete statsWhere.status;

  const [messages, total, statusCounts] = await db.$transaction([
    db.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    db.message.count({ where }),
    db.message.groupBy({
      by: ["status"],
      where: statsWhere,
      orderBy: { status: "asc" },
      _count: { _all: true },
    }),
  ]);

  type StatRow = { status: string; _count: { _all: number } };
  const counts = statusCounts as unknown as StatRow[];
  const stats = {
    total: counts.reduce((sum, s) => sum + s._count._all, 0),
    delivered: counts.find((s) => s.status === "delivered")?._count._all ?? 0,
    sent: counts.find((s) => s.status === "sent")?._count._all ?? 0,
    pending: counts.find((s) => s.status === "pending")?._count._all ?? 0,
    failed: counts.find((s) => s.status === "failed")?._count._all ?? 0,
  };

  return {
    messages,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
    stats,
  };
}

// ==========================================
// Dashboard stats
// ==========================================

export async function getDashboardStats(userId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, todayStats, monthStats, recentMessages] = await db.$transaction([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    db.message.groupBy({
      by: ["status"],
      where: { userId, createdAt: { gte: startOfDay } },
      orderBy: { status: "asc" },
      _count: { _all: true },
    }),
    db.message.groupBy({
      by: ["status"],
      where: { userId, createdAt: { gte: startOfMonth } },
      orderBy: { status: "asc" },
      _count: { _all: true },
    }),
    db.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        recipient: true,
        status: true,
        senderName: true,
        creditCost: true,
        createdAt: true,
      },
    }),
  ]);

  type StatRow = { status: string; _count: { _all: number } };
  const sumCounts = (stats: StatRow[]) => ({
    total: stats.reduce((sum, s) => sum + s._count._all, 0),
    delivered: stats.find((s) => s.status === "delivered")?._count._all ?? 0,
    failed: stats.find((s) => s.status === "failed")?._count._all ?? 0,
    sent: stats.find((s) => s.status === "sent")?._count._all ?? 0,
    pending: stats.find((s) => s.status === "pending")?._count._all ?? 0,
  });

  // 7-day daily breakdown for chart
  const days: string[] = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
  const shortDays: string[] = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const last7Days: { day: string; short: string; date: string; sms: number; delivered: number; failed: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

    const dayStats = await db.message.groupBy({
      by: ["status"],
      where: { userId, createdAt: { gte: dayStart, lt: dayEnd } },
      _count: { _all: true },
    });

    const dayCounts = sumCounts(dayStats as unknown as StatRow[]);
    last7Days.push({
      day: days[d.getDay()],
      short: shortDays[d.getDay()],
      date: d.toISOString().slice(0, 10),
      sms: dayCounts.total,
      delivered: dayCounts.delivered,
      failed: dayCounts.failed,
    });
  }

  // Yesterday stats for delta calculation
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStats = await db.message.groupBy({
    by: ["status"],
    where: { userId, createdAt: { gte: yesterdayStart, lt: yesterdayEnd } },
    _count: { _all: true },
  });
  const yesterday = sumCounts(yesterdayStats as unknown as StatRow[]);

  return {
    user,
    today: sumCounts(todayStats as unknown as StatRow[]),
    yesterday,
    thisMonth: sumCounts(monthStats as unknown as StatRow[]),
    recentMessages,
    last7Days,
  };
}
