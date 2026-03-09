"use server";

import { prisma as db } from "../db";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  sendSmsSchema,
  sendBatchSmsSchema,
  calculateSmsCount,
  normalizePhone,
  reportFilterSchema,
} from "../validations";
import { sendSingleSms, sendSmsBatch } from "../sms-gateway";

// ==========================================
// Send single SMS
// ==========================================

export async function sendSms(userId: string, data: unknown) {
  const input = sendSmsSchema.parse(data);
  const smsCount = calculateSmsCount(input.message);

  // Check credits
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { credits: true },
  });

  if (user.credits < smsCount) {
    throw new Error("เครดิตไม่เพียงพอ กรุณาเติมเงิน");
  }

  // Check sender name is approved
  const sender = await db.senderName.findFirst({
    where: { userId, name: input.senderName, status: "approved" },
  });
  if (!sender && input.senderName !== "EasySlip") {
    throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  // Create message + deduct credits in transaction
  const [message] = await db.$transaction([
    db.message.create({
      data: {
        userId,
        recipient: normalizePhone(input.recipient),
        content: input.message,
        senderName: input.senderName,
        creditCost: smsCount,
        status: "pending",
      },
    }),
    db.user.update({
      where: { id: userId },
      data: { credits: { decrement: smsCount } },
    }),
  ]);

  // Send via EasyThunder SMS Gateway
  try {
    const result = await sendSingleSms(
      normalizePhone(input.recipient),
      input.message,
      input.senderName
    );

    if (result.success) {
      await db.message.update({
        where: { id: message.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          gatewayId: result.jobId || null,
        },
      });
    } else {
      // Gateway returned failure — REFUND credits
      await db.$transaction([
        db.message.update({
          where: { id: message.id },
          data: { status: "failed", errorCode: result.error?.slice(0, 100) || null },
        }),
        db.user.update({
          where: { id: userId },
          data: { credits: { increment: smsCount } },
        }),
      ]);
      throw new Error(result.error || "ส่ง SMS ไม่สำเร็จ");
    }
  } catch (gatewayError) {
    // If gateway throws exception — REFUND credits
    const isSendError = gatewayError instanceof Error && gatewayError.message.includes("ส่ง SMS ไม่สำเร็จ");
    if (!isSendError) {
      await db.$transaction([
        db.message.update({
          where: { id: message.id },
          data: { status: "failed" },
        }),
        db.user.update({
          where: { id: userId },
          data: { credits: { increment: smsCount } },
        }),
      ]);
    }
    throw gatewayError;
  }

  revalidatePath("/dashboard");
  return message;
}

// ==========================================
// Send batch SMS (creates multiple messages)
// ==========================================

export async function sendBatchSms(userId: string, data: unknown) {
  const input = sendBatchSmsSchema.parse(data);
  const smsCount = calculateSmsCount(input.message);
  const totalCredits = smsCount * input.recipients.length;

  // Check credits
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { credits: true },
  });

  if (user.credits < totalCredits) {
    throw new Error(
      `เครดิตไม่เพียงพอ ต้องใช้ ${totalCredits} เครดิต (คงเหลือ ${user.credits})`
    );
  }

  // Check sender name
  const sender = await db.senderName.findFirst({
    where: { userId, name: input.senderName, status: "approved" },
  });
  if (!sender && input.senderName !== "EasySlip") {
    throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
  }

  // Create messages + deduct credits
  const result = await db.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
    const created = await tx.message.createMany({
      data: input.recipients.map((phone) => ({
        userId,
        recipient: normalizePhone(phone),
        content: input.message,
        senderName: input.senderName,
        creditCost: smsCount,
        status: "pending",
      })),
    });

    await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: totalCredits } },
    });

    return created;
  });

  // Send via EasyThunder SMS Gateway (batches of 1000)
  const normalizedRecipients = input.recipients.map(normalizePhone);
  const batches: string[][] = [];
  for (let i = 0; i < normalizedRecipients.length; i += 1000) {
    batches.push(normalizedRecipients.slice(i, i + 1000));
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const batch of batches) {
    try {
      const batchResult = await sendSmsBatch({
        recipients: batch,
        message: input.message,
        sender: input.senderName,
      });
      if (batchResult.success) {
        sentCount += batch.length;
      } else {
        failedCount += batch.length;
      }
    } catch {
      failedCount += batch.length;
    }
  }

  // Refund credits for failed messages
  if (failedCount > 0) {
    const refundCredits = smsCount * failedCount;
    await db.user.update({
      where: { id: userId },
      data: { credits: { increment: refundCredits } },
    });
  }

  revalidatePath("/dashboard");
  return { totalMessages: result.count, totalCredits, sentCount, failedCount };
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
  const input = reportFilterSchema.parse(filters);
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { userId };
  if (input.status) where.status = input.status;
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

  const [messages, total] = await db.$transaction([
    db.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    db.message.count({ where }),
  ]);

  return {
    messages,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
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
      select: { credits: true, name: true, email: true },
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
