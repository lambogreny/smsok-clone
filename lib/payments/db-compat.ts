import { Prisma } from "@prisma/client";
import { prisma as db } from "@/lib/db";

const PAYMENT_FIELD_TO_DB_COLUMN = {
  id: "id",
  packageTierId: "package_tier_id",
  amount: "amount",
  vatAmount: "vat_amount",
  totalAmount: "total_amount",
  whtAmount: "wht_amount",
  netPayAmount: "net_pay_amount",
  hasWht: "has_wht",
  method: "method",
  status: "status",
  slipFileName: "slip_file_name",
  invoiceNumber: "invoice_number",
  invoiceUrl: "invoice_url",
  preInvoiceNumber: "pre_invoice_number",
  preInvoiceUrl: "pre_invoice_url",
  creditNoteNumber: "credit_note_number",
  creditNoteUrl: "credit_note_url",
  expiresAt: "expires_at",
  paidAt: "paid_at",
  createdAt: "created_at",
  creditsAdded: "credits_added",
} as const;

type PaymentDbColumn = (typeof PAYMENT_FIELD_TO_DB_COLUMN)[keyof typeof PAYMENT_FIELD_TO_DB_COLUMN];

let paymentColumnsCache: { expiresAt: number; columns: Set<string> } | null = null;

export async function getPaymentTableColumns(): Promise<Set<string>> {
  const now = Date.now();
  if (paymentColumnsCache && paymentColumnsCache.expiresAt > now) {
    return paymentColumnsCache.columns;
  }

  const rows = await db.$queryRaw<Array<{ column_name: string }>>(Prisma.sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'payments'
  `);

  const columns = new Set(rows.map((row: { column_name: string }) => row.column_name));
  paymentColumnsCache = {
    expiresAt: now + 60_000,
    columns,
  };

  return columns;
}

export function hasPaymentColumn(columns: Set<string>, column: PaymentDbColumn) {
  return columns.has(column);
}

export function prunePaymentSelectForAvailableColumns(
  select: Record<string, unknown>,
  columns: Set<string>,
) {
  const next = { ...select };

  for (const [field, column] of Object.entries(PAYMENT_FIELD_TO_DB_COLUMN)) {
    if (field in next && !columns.has(column)) {
      delete next[field];
    }
  }

  return next;
}

export function prunePaymentWriteDataForAvailableColumns<T extends Record<string, unknown>>(
  data: T,
  columns: Set<string>,
) {
  const next = { ...data };

  for (const [field, column] of Object.entries(PAYMENT_FIELD_TO_DB_COLUMN)) {
    if (field in next && !columns.has(column)) {
      delete next[field as keyof T];
    }
  }

  return next;
}

export function pickPaymentAmountSumField(columns: Set<string>) {
  return hasPaymentColumn(columns, "total_amount") ? "totalAmount" : "amount";
}
