/**
 * Invoice number generator — auto-increment per month, ไม่ซ้ำ
 * Format: INV-YYYYMM-XXXXX (e.g., INV-202603-00001)
 */

import { prisma as db } from "@/lib/db";

const PREFIX_MAP: Record<string, string> = {
  TAX_INVOICE: "TIV",
  RECEIPT: "RCP",
  TAX_INVOICE_RECEIPT: "TIR",
  INVOICE: "INV",
  QUOTATION: "QT",
};

/**
 * Generate next invoice number within a $transaction
 * Uses DocumentSequence table for atomic increment
 */
export async function generateInvoiceNumber(
  type: string,
  tx?: Parameters<Parameters<typeof db.$transaction>[0]>[0],
): Promise<string> {
  const client = tx ?? db;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const yearMonth = `${year}${month}`;

  const prefix = PREFIX_MAP[type] ?? "INV";

  // Upsert to get and increment atomically
  // Using DocumentSequence with type+year as unique key
  // We encode yearMonth as year field (e.g., 202603)
  const yearMonthNum = parseInt(yearMonth, 10);

  const seq = await (client as typeof db).documentSequence.upsert({
    where: {
      type_year: {
        type: type as "TAX_INVOICE" | "RECEIPT" | "TAX_INVOICE_RECEIPT" | "INVOICE" | "DEBIT_NOTE" | "CREDIT_NOTE" | "QUOTATION",
        year: yearMonthNum,
      },
    },
    update: { lastNumber: { increment: 1 } },
    create: {
      type: type as "TAX_INVOICE" | "RECEIPT" | "TAX_INVOICE_RECEIPT" | "INVOICE" | "DEBIT_NOTE" | "CREDIT_NOTE" | "QUOTATION",
      year: yearMonthNum,
      lastNumber: 1,
    },
  });

  const seqNum = String(seq.lastNumber).padStart(5, "0");
  return `${prefix}-${yearMonth}-${seqNum}`;
}
