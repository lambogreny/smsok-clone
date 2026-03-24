
import { prisma as db } from "../db";

import { z } from "zod";

// ── Schemas ────────────────────────────────────────────

const refundSchema = z.object({
  transactionId: z.string().min(1),
  userId: z.string().min(1),
  amount: z.number().positive(),
  credits: z.number().int().positive(),
  reason: z.string().min(1).max(500),
});

const processRefundSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  refundRef: z.string().optional(),
});

const smsAdjustSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int(), // positive = add, negative = deduct
  reason: z.string().min(1).max(500),
});

// ── Revenue Metrics ────────────────────────────────────

export async function getRevenueMetrics(period?: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    revenueMTD,
    revenueYTD,
    pendingInvoices,
    refundsMTD,
    paymentSuccessRate,
  ] = await Promise.all([
    // Revenue MTD
    db.transaction.aggregate({
      where: { status: "completed", createdAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    // Revenue YTD
    db.transaction.aggregate({
      where: { status: "completed", createdAt: { gte: yearStart } },
      _sum: { amount: true },
    }),
    // Pending invoices
    db.transaction.count({ where: { status: "pending" } }),
    // Refunds MTD
    db.refund.aggregate({
      where: { status: "PROCESSED", processedAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    // Payment success rate
    Promise.all([
      db.transaction.count({ where: { createdAt: { gte: monthStart } } }),
      db.transaction.count({ where: { status: "completed", createdAt: { gte: monthStart } } }),
    ]),
  ]);

  const [totalPayments, successPayments] = paymentSuccessRate;
  const successRate = totalPayments > 0 ? ((successPayments / totalPayments) * 100).toFixed(2) : "0.00";

  return {
    revenueMTD: revenueMTD._sum.amount || 0,
    transactionsMTD: revenueMTD._count,
    revenueYTD: revenueYTD._sum.amount || 0,
    pendingInvoices,
    refundsMTD: {
      amount: refundsMTD._sum.amount || 0,
      count: refundsMTD._count,
    },
    paymentSuccessRate: parseFloat(successRate),
  };
}

// ── Recent Transactions ────────────────────────────────

export async function getRecentTransactions(page = 1, limit = 50) {
  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.transaction.count(),
  ]);

  return { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// ── Refunds ────────────────────────────────────────────

export async function createRefund(adminId: string, data: unknown) {
  const parsed = refundSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  // Verify transaction exists
  const transaction = await db.transaction.findUnique({ where: { id: parsed.data.transactionId } });
  if (!transaction) throw new Error("ไม่พบ transaction");
  if (transaction.status !== "completed") throw new Error("สามารถ refund ได้เฉพาะ transaction ที่สำเร็จแล้ว");

  return db.refund.create({
    data: {
      transactionId: parsed.data.transactionId,
      userId: parsed.data.userId,
      amount: parsed.data.amount,
      credits: parsed.data.credits,
      reason: parsed.data.reason,
    },
  });
}

export async function processRefund(adminId: string, refundId: string, data: unknown) {
  const parsed = processRefundSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const refund = await db.refund.findUnique({ where: { id: refundId } });
  if (!refund) throw new Error("ไม่พบ refund request");
  if (refund.status !== "PENDING") throw new Error("Refund นี้ถูกดำเนินการแล้ว");

  if (parsed.data.status === "APPROVED") {
    // Process: restore SMS quota + update refund status
    await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      await tx.refund.update({
        where: { id: refundId },
        data: {
          status: "PROCESSED",
          processedBy: adminId,
          processedAt: new Date(),
          refundRef: parsed.data.refundRef,
        },
      });
      // Add SMS quota back to user's first active package
      const activePackage = await tx.packagePurchase.findFirst({
        where: { userId: refund.userId, isActive: true, expiresAt: { gt: new Date() } },
        orderBy: { expiresAt: "asc" },
      });
      if (activePackage) {
        await tx.packagePurchase.update({
          where: { id: activePackage.id },
          data: { smsTotal: { increment: refund.credits } },
        });
      }
    });
  } else {
    await db.refund.update({
      where: { id: refundId },
      data: {
        status: "REJECTED",
        processedBy: adminId,
        processedAt: new Date(),
      },
    });
  }
}

export async function getPendingRefunds(page = 1, limit = 20) {
  const [refunds, total] = await Promise.all([
    db.refund.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.refund.count({ where: { status: "PENDING" } }),
  ]);
  return { refunds, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

// ── SMS Quota Adjustment ──────────────────────────────────

export async function adjustSmsQuota(adminId: string, data: unknown) {
  const parsed = smsAdjustSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const user = await db.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
  if (!user) throw new Error("ไม่พบผู้ใช้");

  const activePackage = await db.packagePurchase.findFirst({
    where: { userId: parsed.data.userId, isActive: true, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "asc" },
  });

  if (!activePackage) {
    throw new Error("ผู้ใช้ไม่มี package ที่ใช้งานอยู่");
  }

  if (parsed.data.amount < 0) {
    const available = activePackage.smsTotal - activePackage.smsUsed;
    if (available + parsed.data.amount < 0) {
      throw new Error("SMS ไม่เพียงพอสำหรับการหัก");
    }
  }

  await db.packagePurchase.update({
    where: { id: activePackage.id },
    data: { smsTotal: { increment: parsed.data.amount } },
  });

  const newRemaining = (activePackage.smsTotal + parsed.data.amount) - activePackage.smsUsed;
  return { userId: parsed.data.userId, smsAdjusted: parsed.data.amount, smsRemaining: newRemaining };
}

// ── Tax Report ─────────────────────────────────────────

export async function generateTaxReport(adminId: string, type: string, period: string) {
  const [year, month] = period.split("-").map(Number);
  let startDate: Date;
  let endDate: Date;

  if (month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 1);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year + 1, 0, 1);
  }

  const transactions = await db.transaction.findMany({
    where: {
      status: "completed",
      createdAt: { gte: startDate, lt: endDate },
    },
    select: { amount: true, credits: true, method: true, createdAt: true },
  });

  const totalRevenue = transactions.reduce((sum: number, t: (typeof transactions)[number]) => sum + t.amount, 0);
  const vatRate = 0.07;
  const revenueBeforeVat = totalRevenue / (1 + vatRate);
  const totalVat = totalRevenue - revenueBeforeVat;

  // WHT from wht_certificates in period
  const whtCerts = await db.whtCertificate.aggregate({
    where: {
      status: "APPROVED",
      whtDate: { gte: startDate, lt: endDate },
    },
    _sum: { whtAmount: true },
  });

  const totalWht = whtCerts._sum.whtAmount ? Number(whtCerts._sum.whtAmount) : 0;

  const report = await db.taxReport.upsert({
    where: { type_period: { type, period } },
    update: {
      totalRevenue: revenueBeforeVat,
      totalVat,
      totalWht,
      netAmount: totalRevenue - totalWht,
      transactionCount: transactions.length,
      data: { transactions: transactions.length, methods: {} },
      generatedBy: adminId,
    },
    create: {
      type,
      period,
      totalRevenue: revenueBeforeVat,
      totalVat,
      totalWht,
      netAmount: totalRevenue - totalWht,
      transactionCount: transactions.length,
      data: { transactions: transactions.length, methods: {} },
      generatedBy: adminId,
    },
  });

  return report;
}

export async function getTaxReports(type?: string) {
  return db.taxReport.findMany({
    where: type ? { type } : {},
    orderBy: { period: "desc" },
  });
}
