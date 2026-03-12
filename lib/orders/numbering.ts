import { type DocumentType, type PrismaClient } from "@prisma/client";
import { prisma as db } from "@/lib/db";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type DbClient = PrismaClient | TxClient;

export type OrderDocumentKind =
  | "order"
  | "quotation"
  | "invoice"
  | "credit-note"
  | "debit-note";

const PREFIX_BY_KIND: Record<OrderDocumentKind, string> = {
  order: "ORD",
  quotation: "QT",
  invoice: "INV",
  "credit-note": "CN",
  "debit-note": "DN",
};

const TYPE_BY_KIND: Record<OrderDocumentKind, DocumentType> = {
  order: "ORDER",
  quotation: "QUOTATION",
  invoice: "INVOICE",
  "credit-note": "CREDIT_NOTE",
  "debit-note": "DEBIT_NOTE",
};

export async function generateOrderDocumentNumber(
  kind: OrderDocumentKind,
  client: DbClient = db,
  now = new Date(),
) {
  const year = now.getFullYear();
  const type = TYPE_BY_KIND[kind];
  const prefix = PREFIX_BY_KIND[kind];

  const sequence = await client.documentSequence.upsert({
    where: {
      type_year: {
        type,
        year,
      },
    },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      type,
      year,
      lastNumber: 1,
    },
  });

  return `${prefix}${year}-${String(sequence.lastNumber).padStart(5, "0")}`;
}
