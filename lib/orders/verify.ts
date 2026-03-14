import { prisma as db } from "@/lib/db";

const ORDER_DOCUMENT_LABELS = {
  invoice: "ใบแจ้งหนี้",
  tax_invoice: "ใบกำกับภาษี",
  receipt: "ใบเสร็จรับเงิน",
  credit_note: "ใบลดหนี้",
} as const;

const ORDER_DOCUMENT_PATHS = {
  invoice: "invoice",
  tax_invoice: "tax-invoice",
  receipt: "receipt",
  credit_note: "credit-note",
} as const;

const DB_TO_API_DOCUMENT_TYPE = {
  INVOICE: "invoice",
  TAX_INVOICE: "tax_invoice",
  RECEIPT: "receipt",
  CREDIT_NOTE: "credit_note",
} as const;

type ApiDocumentType = keyof typeof ORDER_DOCUMENT_LABELS;

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export async function getPublicOrderDocumentVerification(code: string) {
  const document = await db.orderDocument.findUnique({
    where: { documentNumber: code },
    select: {
      id: true,
      type: true,
      documentNumber: true,
      issuedAt: true,
      voidedAt: true,
      voidReason: true,
      deletedAt: true,
      pdfUrl: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          packageName: true,
          taxName: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!document) {
    return null;
  }

  const apiType = DB_TO_API_DOCUMENT_TYPE[document.type] as ApiDocumentType;
  const status = document.deletedAt
    ? "deleted"
    : document.voidedAt
      ? "voided"
      : "valid";

  return {
    code: document.documentNumber,
    valid: status === "valid",
    status,
    type: apiType,
    label: ORDER_DOCUMENT_LABELS[apiType],
    issued_at: document.issuedAt.toISOString(),
    voided_at: document.voidedAt?.toISOString() ?? null,
    void_reason: document.voidReason ?? null,
    order: {
      id: document.order.id,
      order_number: document.order.orderNumber,
      package_name: document.order.packageName,
      customer_name: document.order.taxName,
      total_amount: toNumber(document.order.totalAmount),
      created_at: document.order.createdAt.toISOString(),
    },
    document_url:
      document.pdfUrl ||
      `/api/v1/orders/${document.order.id}/documents/${ORDER_DOCUMENT_PATHS[apiType]}`,
  };
}
