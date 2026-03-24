import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import {
  getPaymentTableColumns,
  prunePaymentSelectForAvailableColumns,
} from "@/lib/payments/db-compat";
import { z } from "zod";

const historySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "PROCESSING",
      "PENDING_REVIEW",
      "COMPLETED",
      "FAILED",
      "REFUNDED",
      "EXPIRED",
    ])
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return apiError(new ApiError(401, "กรุณาเข้าสู่ระบบ"));

    const params = Object.fromEntries(new URL(req.url).searchParams);
    const { page, limit, status } = historySchema.parse(params);

    const where = {
      userId: session.id,
      ...(status ? { status } : {}),
    };

    const paymentColumns = await getPaymentTableColumns() as Set<string>;
    const paymentSelect = prunePaymentSelectForAvailableColumns({
      id: true,
      amount: true,
      totalAmount: true,
      creditsAdded: true,
      method: true,
      status: true,
      slipFileName: true,
      invoiceNumber: true,
      invoiceUrl: true,
      paidAt: true,
      createdAt: true,
      packageTier: {
        select: {
          id: true,
          tierCode: true,
          name: true,
          totalSms: true,
        },
      },
    }, paymentColumns);

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        select: paymentSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }) as Promise<Array<Record<string, any>>>,
      db.payment.count({ where }),
    ]);

    const items = payments.map((payment: (typeof payments)[number]) => ({
      smsAdded: payment.creditsAdded ?? payment.packageTier?.totalSms ?? 0,
      smsQuota: payment.creditsAdded ?? payment.packageTier?.totalSms ?? 0,
      id: payment.id,
      transactionId: payment.id,
      packageId: payment.packageTier?.id ?? null,
      tierCode: payment.packageTier?.tierCode ?? null,
      packageName: payment.packageTier?.name ?? null,
      credits: payment.creditsAdded ?? payment.packageTier?.totalSms ?? 0,
      amount: (payment.totalAmount ?? payment.amount) / 100,
      amountSatang: payment.totalAmount ?? payment.amount,
      method: payment.method,
      status: payment.status,
      verified: payment.status === "COMPLETED",
      hasSlip: Boolean(payment.slipFileName),
      invoiceNumber: payment.invoiceNumber,
      invoiceUrl: payment.invoiceUrl,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    }));

    return apiResponse({
      payments: items,
      transactions: items,
      page,
      limit,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
