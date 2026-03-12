import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import {
  calculatePaymentAmounts,
  generatePaymentDocumentNumber,
  getUserPrimaryOrganizationId,
} from "@/lib/payments/documents";
import { z } from "zod";

const listSchema = z.object({
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
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createSchema = z.object({
  packageTierId: z.string().min(1), // accepts UUID or tierCode (e.g. "B", "C")
  taxProfileId: z.string().min(1).optional(),
  hasWht: z.boolean().optional().default(false),
});

// GET /api/payments — list user's payments (billing history)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = listSchema.parse(params);

    const where: Record<string, unknown> = { userId: session.id };
    if (input.status) where.status = input.status;
    if (input.dateFrom || input.dateTo) {
      where.createdAt = {};
      if (input.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(input.dateFrom);
      if (input.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(input.dateTo);
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        select: {
          id: true,
          packageTierId: true,
          amount: true,
          vatAmount: true,
          totalAmount: true,
          whtAmount: true,
          netPayAmount: true,
          hasWht: true,
          method: true,
          status: true,
          slipFileName: true,
          invoiceNumber: true,
          invoiceUrl: true,
          preInvoiceNumber: true,
          preInvoiceUrl: true,
          creditNoteNumber: true,
          creditNoteUrl: true,
          expiresAt: true,
          paidAt: true,
          createdAt: true,
          packageTier: { select: { name: true, tierCode: true, totalSms: true, bonusPercent: true, expiryMonths: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      db.payment.count({ where }),
    ]);

    return apiResponse({
      payments: payments.map((payment) => ({
        ...payment,
        rawStatus: payment.status,
        status: payment.status === "EXPIRED" ? "FAILED" : payment.status,
        hasSlip: Boolean(payment.slipFileName),
        slipUrl: null,
      })),
      pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/payments — create payment (select package)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "purchase");
    if (rl.blocked) return rl.blocked;

    const input = createSchema.parse(await req.json());
    const organizationId = await getUserPrimaryOrganizationId(session.id);

    // Accept both UUID and tierCode (e.g. "B", "C")
    const isUuid = input.packageTierId.length > 10; // cuid is ~25 chars, tierCode is 1-3 chars
    const tier = isUuid
      ? await db.packageTier.findUnique({
          where: { id: input.packageTierId },
          select: { id: true, name: true, tierCode: true, price: true, totalSms: true, bonusPercent: true, expiryMonths: true, isActive: true },
        })
      : await db.packageTier.findUnique({
          where: { tierCode: input.packageTierId },
          select: { id: true, name: true, tierCode: true, price: true, totalSms: true, bonusPercent: true, expiryMonths: true, isActive: true },
        });
    if (!tier || !tier.isActive) throw new ApiError(404, "ไม่พบแพ็กเกจ");

    const fallbackTaxProfile = await db.taxProfile.findFirst({
      where: {
        userId: session.id,
        isDefault: true,
        ...(organizationId
          ? { OR: [{ organizationId }, { organizationId: null }] }
          : { organizationId: null }),
      },
      select: { id: true },
    });
    const resolvedTaxProfileId = input.taxProfileId ?? fallbackTaxProfile?.id ?? null;

    if (input.hasWht && !resolvedTaxProfileId) {
      throw new ApiError(400, "กรุณาเลือกข้อมูลออกใบกำกับภาษีก่อนหักภาษี ณ ที่จ่าย");
    }

    if (resolvedTaxProfileId) {
      const taxProfile = await db.taxProfile.findFirst({
        where: {
          id: resolvedTaxProfileId,
          userId: session.id,
          ...(organizationId
            ? { OR: [{ organizationId }, { organizationId: null }] }
            : {}),
        },
        select: { id: true },
      });
      if (!taxProfile) {
        throw new ApiError(404, "ไม่พบข้อมูลออกใบกำกับภาษี");
      }
    }

    // Package tier price is VAT-exclusive in schema.
    const amountSatang = Math.round(Number(tier.price) * 100);
    const totals = calculatePaymentAmounts(amountSatang, input.hasWht);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const payment = await db.$transaction(async (tx) => {
      const preInvoiceNumber = await generatePaymentDocumentNumber("pre-invoice", tx);

      const created = await tx.payment.create({
        data: {
          userId: session.id,
          organizationId,
          packageTierId: tier.id,
          taxProfileId: resolvedTaxProfileId,
          amount: totals.amountSatang,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          hasWht: input.hasWht,
          whtAmount: totals.whtAmount,
          netPayAmount: totals.netPayAmount,
          method: "BANK_TRANSFER",
          status: "PENDING",
          expiresAt,
          preInvoiceNumber,
        },
        select: {
          id: true,
          amount: true,
          vatAmount: true,
          totalAmount: true,
          whtAmount: true,
          netPayAmount: true,
          hasWht: true,
          status: true,
          preInvoiceNumber: true,
          createdAt: true,
          expiresAt: true,
        },
      });

      const preInvoiceUrl = `/api/payments/${created.id}/pre-invoice?download=1`;
      await tx.payment.update({
        where: { id: created.id },
        data: {
          preInvoiceUrl,
        },
      });

      await tx.paymentHistory.create({
        data: {
          paymentId: created.id,
          toStatus: "PENDING",
          changedBy: "system",
          note: "Payment created",
        },
      });

      return {
        ...created,
        preInvoiceUrl,
      };
    });

    return apiResponse({
      ...payment,
      packageName: tier.name,
      tierCode: tier.tierCode,
      smsCredits: tier.totalSms,
      bonusPercent: tier.bonusPercent,
      expiryMonths: tier.expiryMonths,
      taxProfileId: resolvedTaxProfileId,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}
