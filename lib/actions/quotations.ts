
import { prisma as db } from "../db";
import { z } from "zod";
import { generateInvoiceNumber } from "../accounting/invoice-number";
import { numberToThaiText } from "../accounting/thai-number";

// ── Schemas ──────────────────────────────────────────────

const quotationItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
});

const createQuotationSchema = z.object({
  buyerName: z.string().min(1, "กรุณากรอกชื่อผู้ซื้อ"),
  buyerAddress: z.string().min(1, "กรุณากรอกที่อยู่"),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  items: z.array(quotationItemSchema).min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
  vatRate: z.number().min(0).max(100).default(7),
  validDays: z.number().int().min(1).max(365).default(30),
  notes: z.string().max(1000).optional(),
});

const updateQuotationSchema = z.object({
  buyerName: z.string().min(1).optional(),
  buyerAddress: z.string().min(1).optional(),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  items: z.array(quotationItemSchema).min(1).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  validDays: z.number().int().min(1).max(365).optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
});

const listQuotationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
});

// ── CRUD ─────────────────────────────────────────────────

export async function createQuotation(userId: string, data: unknown) {
  const input = createQuotationSchema.parse(data);

  const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = Math.round(subtotal * (input.vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + input.validDays);

  const quotation = await db.$transaction(async (tx) => {
    const quotationNumber = await generateInvoiceNumber("QUOTATION", tx);

    return tx.quotation.create({
      data: {
        userId,
        quotationNumber,
        buyerName: input.buyerName,
        buyerAddress: input.buyerAddress,
        buyerPhone: input.buyerPhone,
        buyerEmail: input.buyerEmail,
        items: input.items,
        subtotal,
        vatRate: input.vatRate,
        vatAmount,
        total,
        amountInWords: numberToThaiText(total),
        validUntil,
        notes: input.notes,
        status: "DRAFT",
      },
    });
  });

  return quotation;
}

export async function getQuotation(userId: string, quotationId: string) {
  const quotation = await db.quotation.findFirst({
    where: { id: quotationId, userId },
  });
  if (!quotation) throw new Error("ไม่พบใบเสนอราคา");
  return quotation;
}

export async function listQuotations(userId: string, filters: unknown) {
  const input = listQuotationsSchema.parse(filters);
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { userId };
  if (input.status) where.status = input.status;

  const [quotations, total] = await db.$transaction([
    db.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit,
    }),
    db.quotation.count({ where }),
  ]);

  return {
    quotations,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
    },
  };
}

export async function updateQuotation(
  userId: string,
  quotationId: string,
  data: unknown,
) {
  const existing = await db.quotation.findFirst({
    where: { id: quotationId, userId },
  });
  if (!existing) throw new Error("ไม่พบใบเสนอราคา");

  if (existing.status === "ACCEPTED") {
    throw new Error("ใบเสนอราคาที่ถูกรับแล้วไม่สามารถแก้ไขได้");
  }

  const input = updateQuotationSchema.parse(data);

  // Recalculate totals if items or vatRate changed
  const items = input.items ?? (existing.items as Array<{ amount: number }>);
  const vatRate = input.vatRate ?? Number(existing.vatRate);

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  const validUntil = input.validDays
    ? new Date(existing.createdAt.getTime() + input.validDays * 24 * 60 * 60 * 1000)
    : existing.validUntil;

  return db.quotation.update({
    where: { id: quotationId },
    data: {
      ...(input.buyerName && { buyerName: input.buyerName }),
      ...(input.buyerAddress && { buyerAddress: input.buyerAddress }),
      ...(input.buyerPhone !== undefined && { buyerPhone: input.buyerPhone }),
      ...(input.buyerEmail !== undefined && { buyerEmail: input.buyerEmail }),
      ...(input.items && { items: input.items }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.status && { status: input.status }),
      subtotal,
      vatRate,
      vatAmount,
      total,
      amountInWords: numberToThaiText(total),
      validUntil,
    },
  });
}

export async function deleteQuotation(userId: string, quotationId: string) {
  const existing = await db.quotation.findFirst({
    where: { id: quotationId, userId },
  });
  if (!existing) throw new Error("ไม่พบใบเสนอราคา");

  if (existing.status === "ACCEPTED") {
    throw new Error("ใบเสนอราคาที่ถูกรับแล้วไม่สามารถลบได้");
  }

  await db.quotation.delete({ where: { id: quotationId } });
}
