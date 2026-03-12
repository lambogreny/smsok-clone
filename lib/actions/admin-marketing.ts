
import { prisma as db } from "../db";
import { z } from "zod";

// ══════════════════════════════════════════════════════════
// 1. Marketing Metrics
// ══════════════════════════════════════════════════════════

export async function getMarketingMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newSignups,
    usersWithTransaction,
    usersWithMessage,
    usersCreatedBefore30Days,
    usersActiveLast30Days,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.user.count({
      where: { transactions: { some: { status: "completed" } } },
    }),
    db.user.count({
      where: { messages: { some: {} } },
    }),
    db.user.count({
      where: { createdAt: { lt: thirtyDaysAgo } },
    }),
    db.user.count({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const conversionRate =
    totalUsers > 0 ? (usersWithTransaction / totalUsers) * 100 : 0;
  const activationRate =
    totalUsers > 0 ? (usersWithMessage / totalUsers) * 100 : 0;
  const retentionRate =
    usersCreatedBefore30Days > 0
      ? (usersActiveLast30Days / usersCreatedBefore30Days) * 100
      : 0;

  return {
    newSignups,
    conversionRate: Math.round(conversionRate * 100) / 100,
    activationRate: Math.round(activationRate * 100) / 100,
    retentionRate: Math.round(retentionRate * 100) / 100,
    totalUsers,
  };
}

// ══════════════════════════════════════════════════════════
// 2. Funnel Data
// ══════════════════════════════════════════════════════════

export async function getFunnelData() {
  const [totalSignups, verified, sentFirstSMS, madeFirstPayment] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { emailVerified: true } }),
      db.user.count({ where: { messages: { some: {} } } }),
      db.user.count({
        where: { transactions: { some: { status: "completed" } } },
      }),
    ]);

  return [
    { stage: "Total Signups", count: totalSignups },
    { stage: "Verified", count: verified },
    { stage: "Sent First SMS", count: sentFirstSMS },
    { stage: "Made First Payment", count: madeFirstPayment },
  ];
}

// ══════════════════════════════════════════════════════════
// 3. Cohort Retention
// ══════════════════════════════════════════════════════════

export async function getCohortData(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  // Single query: get cohort signup month, activity month, and distinct user count
  const rows = await db.$queryRaw<
    { cohort_month: Date; active_month: Date; users: bigint }[]
  >`
    SELECT
      DATE_TRUNC('month', created_at) AS cohort_month,
      DATE_TRUNC('month', updated_at) AS active_month,
      COUNT(DISTINCT id) AS users
    FROM users
    WHERE created_at >= ${start}
    GROUP BY cohort_month, active_month
    ORDER BY cohort_month, active_month
  `;

  // Also get cohort sizes (total signups per month) in one query
  const cohortSizes = await db.$queryRaw<
    { cohort_month: Date; total: bigint }[]
  >`
    SELECT DATE_TRUNC('month', created_at) AS cohort_month, COUNT(*) AS total
    FROM users
    WHERE created_at >= ${start}
    GROUP BY cohort_month
    ORDER BY cohort_month
  `;

  // Build lookup maps
  const sizeMap = new Map<string, number>();
  for (const row of cohortSizes) {
    const key = formatCohortKey(new Date(row.cohort_month));
    sizeMap.set(key, Number(row.total));
  }

  // activity[cohortKey][activeKey] = count of distinct users
  const activity = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const cohortKey = formatCohortKey(new Date(row.cohort_month));
    const activeKey = formatCohortKey(new Date(row.active_month));
    if (!activity.has(cohortKey)) {
      activity.set(cohortKey, new Map());
    }
    activity.get(cohortKey)!.set(activeKey, Number(row.users));
  }

  // Build result matching original return type
  const cohorts: { cohort: string; months: number[] }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortLabel = formatCohortKey(cohortDate);
    const cohortUsers = sizeMap.get(cohortLabel) ?? 0;

    if (cohortUsers === 0) {
      cohorts.push({ cohort: cohortLabel, months: [] });
      continue;
    }

    const monthsToCheck =
      now.getMonth() - cohortDate.getMonth() +
      (now.getFullYear() - cohortDate.getFullYear()) * 12;

    const monthlyRetention: number[] = [];
    const cohortActivity = activity.get(cohortLabel);

    for (let m = 0; m <= monthsToCheck; m++) {
      const checkDate = new Date(
        cohortDate.getFullYear(),
        cohortDate.getMonth() + m,
        1,
      );
      const checkKey = formatCohortKey(checkDate);
      const activeInMonth = cohortActivity?.get(checkKey) ?? 0;
      monthlyRetention.push(
        Math.round((activeInMonth / cohortUsers) * 100 * 100) / 100,
      );
    }

    cohorts.push({ cohort: cohortLabel, months: monthlyRetention });
  }

  return cohorts;
}

function formatCohortKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ══════════════════════════════════════════════════════════
// 4. Inactive Users (Win-back targets)
// ══════════════════════════════════════════════════════════

export async function getInactiveUsers(days = 30, limit = 50) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const users = await db.user.findMany({
    where: { updatedAt: { lt: cutoff } },
    select: {
      id: true,
      name: true,
      email: true,
      updatedAt: true,
      messages: {
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      transactions: {
        where: { status: "completed" },
        select: { amount: true },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    lastActive: u.updatedAt,
    lastMessageDate: u.messages[0]?.createdAt ?? null,
    totalSpend: u.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));
}

// ══════════════════════════════════════════════════════════
// 5. Power Users (Top SMS senders)
// ══════════════════════════════════════════════════════════

export async function getPowerUsers(limit = 20) {
  const results = await db.message.groupBy({
    by: ["userId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const userIds = results.map((r) => r.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return results.map((r) => ({
    userId: r.userId,
    name: userMap.get(r.userId)?.name ?? "",
    email: userMap.get(r.userId)?.email ?? "",
    messageCount: r._count.id,
  }));
}

// ══════════════════════════════════════════════════════════
// 6. Trial to Paid Conversion
// ══════════════════════════════════════════════════════════

export async function getTrialConversion() {
  const [totalUsers, convertedUsers] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: { transactions: { some: { status: "completed" } } },
    }),
  ]);

  const trialUsers = totalUsers - convertedUsers;
  const rate =
    totalUsers > 0 ? (convertedUsers / totalUsers) * 100 : 0;

  return {
    totalUsers,
    trialUsers,
    convertedUsers,
    conversionRate: Math.round(rate * 100) / 100,
  };
}

// ══════════════════════════════════════════════════════════
// 7. Create Promo Code
// ══════════════════════════════════════════════════════════

const createPromoCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .transform((v) => v.toUpperCase()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
});

export async function createPromoCode(data: unknown) {
  const result = createPromoCodeSchema.safeParse(data);
  if (!result.success) {
    throw new Error("ข้อมูลไม่ถูกต้อง: " + result.error.issues.map((i) => i.message).join(", "));
  }

  const { code, discountType, discountValue, maxUses, expiresAt } = result.data;

  // Check duplicate
  const existing = await db.promoCode.findUnique({ where: { code } });
  if (existing) {
    throw new Error("โค้ดนี้มีอยู่แล้ว");
  }

  // Map discountType to schema values: PERCENTAGE → "percent", FIXED → "credits"
  const dbDiscountType = discountType === "PERCENTAGE" ? "percent" : "credits";

  const promo = await db.promoCode.create({
    data: {
      code,
      discountType: dbDiscountType,
      discountValue,
      maxUses: maxUses ?? null,
      active: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return promo;
}

// ══════════════════════════════════════════════════════════
// 8. List Promo Codes
// ══════════════════════════════════════════════════════════

export async function getPromoCodes(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [promoCodes, total] = await Promise.all([
    db.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.promoCode.count(),
  ]);

  return {
    promoCodes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ══════════════════════════════════════════════════════════
// 9. Send Promo SMS Quota
// ══════════════════════════════════════════════════════════

const sendPromoSmsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  reason: z.string().min(1),
});

export async function sendPromoSms(
  userId: string,
  amount: number,
  reason: string,
) {
  const parsed = sendPromoSmsSchema.safeParse({ userId, amount, reason });
  if (!parsed.success) {
    throw new Error("ข้อมูลไม่ถูกต้อง: " + parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Add SMS to user's first active package
  const activePackage = await db.packagePurchase.findFirst({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
  });

  if (!activePackage) {
    throw new Error("ผู้ใช้ไม่มี package ที่ใช้งานอยู่");
  }

  await db.packagePurchase.update({
    where: { id: activePackage.id },
    data: { smsTotal: { increment: amount } },
  });

  return { userId, smsAdded: amount, reason };
}
