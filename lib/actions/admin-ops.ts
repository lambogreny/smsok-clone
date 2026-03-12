
import { prisma as db } from "../db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ── Schemas ────────────────────────────────────────────

const createProviderSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  apiUrl: z.string().url(),
  credentials: z.record(z.string(), z.string()),
  costPerSms: z.number().positive(),
  priority: z.number().int().min(0).optional(),
  dailyLimit: z.number().int().positive().optional(),
  balanceAlert: z.number().positive().optional(),
});

const updateProviderSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  apiUrl: z.string().url().optional(),
  credentials: z.record(z.string(), z.string()).optional(),
  status: z.enum(["ACTIVE", "DEGRADED", "DOWN", "MAINTENANCE"]).optional(),
  priority: z.number().int().min(0).optional(),
  costPerSms: z.number().positive().optional(),
  dailyLimit: z.number().int().positive().nullable().optional(),
  balanceAlert: z.number().positive().nullable().optional(),
});

const failoverSchema = z.object({
  primaryId: z.string().min(1),
  secondaryId: z.string().min(1),
  triggerThreshold: z.number().min(0).max(100),
  autoEnabled: z.boolean().optional(),
});

const blacklistSchema = z.object({
  phone: z.string().min(10).max(15),
  reason: z.string().min(1).max(200),
});

// ── Provider Management ────────────────────────────────

export async function getProviders() {
  return db.smsProvider.findMany({
    orderBy: { priority: "asc" },
    include: {
      _count: { select: { deliveryReports: true } },
    },
  });
}

export async function createProvider(adminId: string, data: unknown) {
  const parsed = createProviderSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  return db.smsProvider.create({
    data: {
      name: parsed.data.name,
      displayName: parsed.data.displayName,
      apiUrl: parsed.data.apiUrl,
      credentials: parsed.data.credentials as Prisma.InputJsonValue,
      costPerSms: parsed.data.costPerSms,
      priority: parsed.data.priority ?? 0,
      dailyLimit: parsed.data.dailyLimit,
      balanceAlert: parsed.data.balanceAlert,
    },
  });
}

export async function updateProvider(providerId: string, data: unknown) {
  const parsed = updateProviderSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const provider = await db.smsProvider.findUnique({ where: { id: providerId } });
  if (!provider) throw new Error("ไม่พบ provider");

  const updateData: Record<string, unknown> = {};
  if (parsed.data.displayName) updateData.displayName = parsed.data.displayName;
  if (parsed.data.apiUrl) updateData.apiUrl = parsed.data.apiUrl;
  if (parsed.data.credentials) updateData.credentials = parsed.data.credentials as Prisma.InputJsonValue;
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.costPerSms) updateData.costPerSms = parsed.data.costPerSms;
  if (parsed.data.dailyLimit !== undefined) updateData.dailyLimit = parsed.data.dailyLimit;
  if (parsed.data.balanceAlert !== undefined) updateData.balanceAlert = parsed.data.balanceAlert;

  return db.smsProvider.update({
    where: { id: providerId },
    data: updateData,
  });
}

// ── Failover Config ────────────────────────────────────

export async function getFailoverConfigs() {
  return db.failoverConfig.findMany({
    include: { primary: { select: { id: true, name: true, displayName: true, status: true } } },
  });
}

export async function setFailoverConfig(data: unknown) {
  const parsed = failoverSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  if (parsed.data.primaryId === parsed.data.secondaryId) {
    throw new Error("Primary และ Secondary ต้องไม่ซ้ำกัน");
  }

  return db.failoverConfig.upsert({
    where: {
      primaryId_secondaryId: {
        primaryId: parsed.data.primaryId,
        secondaryId: parsed.data.secondaryId,
      },
    },
    update: {
      triggerThreshold: parsed.data.triggerThreshold,
      autoEnabled: parsed.data.autoEnabled ?? true,
    },
    create: {
      primaryId: parsed.data.primaryId,
      secondaryId: parsed.data.secondaryId,
      triggerThreshold: parsed.data.triggerThreshold,
      autoEnabled: parsed.data.autoEnabled ?? true,
    },
  });
}

// ── Delivery Metrics ───────────────────────────────────

export async function getOpsMetrics() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const [
    todayTotal,
    todayDelivered,
    todayFailed,
    yesterdayTotal,
    providers,
  ] = await Promise.all([
    db.message.count({ where: { createdAt: { gte: todayStart } } }),
    db.message.count({ where: { createdAt: { gte: todayStart }, status: "delivered" } }),
    db.message.count({ where: { createdAt: { gte: todayStart }, status: "failed" } }),
    db.message.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    db.smsProvider.findMany({
      select: { id: true, name: true, displayName: true, status: true, balance: true, dailySent: true, dailyLimit: true },
      orderBy: { priority: "asc" },
    }),
  ]);

  const deliveryRate = todayTotal > 0 ? ((todayDelivered / todayTotal) * 100).toFixed(2) : "0.00";

  return {
    today: {
      total: todayTotal,
      delivered: todayDelivered,
      failed: todayFailed,
      pending: todayTotal - todayDelivered - todayFailed,
      deliveryRate: parseFloat(deliveryRate),
    },
    yesterday: { total: yesterdayTotal },
    providers,
  };
}

// ── Failed Messages ────────────────────────────────────

export async function getFailedMessages(page = 1, limit = 100) {
  const [messages, total] = await Promise.all([
    db.message.findMany({
      where: { status: "failed" },
      select: {
        id: true,
        recipient: true,
        errorCode: true,
        senderName: true,
        createdAt: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.message.count({ where: { status: "failed" } }),
  ]);

  return { messages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// ── Phone Blacklist ────────────────────────────────────

export async function addToBlacklist(adminId: string, data: unknown) {
  const parsed = blacklistSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  return db.phoneBlacklist.upsert({
    where: { phone: parsed.data.phone },
    update: { reason: parsed.data.reason, addedBy: adminId },
    create: { phone: parsed.data.phone, reason: parsed.data.reason, addedBy: adminId },
  });
}

export async function removeFromBlacklist(phone: string) {
  await db.phoneBlacklist.delete({ where: { phone } }).catch(() => {});
}

export async function getBlacklist(page = 1, limit = 50) {
  const [items, total] = await Promise.all([
    db.phoneBlacklist.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.phoneBlacklist.count(),
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
