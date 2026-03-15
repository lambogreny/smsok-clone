import {
  type OrderDocumentType,
  type PrismaClient,
} from "@prisma/client";
import { prisma as db } from "@/lib/db";
import { generateOrderDocumentNumber } from "@/lib/orders/numbering";
import { renderOrderAccountingDocumentPdf } from "@/lib/orders/pdf";
import { storeBufferInR2 } from "@/lib/storage/service";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type DbClient = PrismaClient | TxClient;

export const orderSummarySelect = {
  id: true,
  orderNumber: true,
  packageTierId: true,
  packageName: true,
  smsCount: true,
  customerType: true,
  taxName: true,
  taxId: true,
  taxAddress: true,
  taxBranchType: true,
  taxBranchNumber: true,
  netAmount: true,
  vatAmount: true,
  totalAmount: true,
  hasWht: true,
  whtAmount: true,
  payAmount: true,
  status: true,
  expiresAt: true,
  quotationNumber: true,
  quotationUrl: true,
  invoiceNumber: true,
  invoiceUrl: true,
  slipUrl: true,
  whtCertUrl: true,
  easyslipVerified: true,
  rejectReason: true,
  rejectMessage: true,
  rejectedAt: true,
  slipAttemptCount: true,
  adminNote: true,
  paidAt: true,
  cancelledAt: true,
  cancellationReason: true,
  createdAt: true,
} as const;

export const orderDetailSelect = {
  ...orderSummarySelect,
  documents: {
    where: { deletedAt: null },
    orderBy: { issuedAt: "asc" },
    select: {
      id: true,
      type: true,
      documentNumber: true,
      verificationCode: true,
      issuedAt: true,
      voidedAt: true,
      voidReason: true,
      replacesDocumentId: true,
      pdfUrl: true,
      deletedAt: true,
    },
  },
  slips: {
    where: { deletedAt: null },
    orderBy: { uploadedAt: "asc" },
    select: {
      id: true,
      fileUrl: true,
      fileKey: true,
      fileSize: true,
      fileType: true,
      uploadedAt: true,
      verifiedAt: true,
      verifiedBy: true,
      deletedAt: true,
    },
  },
  history: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      changedBy: true,
      note: true,
      createdAt: true,
    },
  },
} as const;

export const orderPdfSelect = {
  id: true,
  userId: true,
  orderNumber: true,
  customerType: true,
  packageName: true,
  smsCount: true,
  taxName: true,
  taxId: true,
  taxAddress: true,
  taxBranchType: true,
  taxBranchNumber: true,
  netAmount: true,
  vatAmount: true,
  totalAmount: true,
  hasWht: true,
  whtAmount: true,
  payAmount: true,
  quotationNumber: true,
  invoiceNumber: true,
  expiresAt: true,
  paidAt: true,
  createdAt: true,
  user: {
    select: {
      email: true,
      phone: true,
    },
  },
} as const;

const ORDER_DOCUMENT_KIND: Record<
  OrderDocumentType,
  "invoice" | "tax-invoice" | "receipt" | "credit-note"
> = {
  INVOICE: "invoice",
  TAX_INVOICE: "tax-invoice",
  RECEIPT: "receipt",
  CREDIT_NOTE: "credit-note",
};

export function documentTypeToApiPath(type: OrderDocumentType) {
  switch (type) {
    case "INVOICE":
      return "invoice";
    case "TAX_INVOICE":
      return "tax-invoice";
    case "RECEIPT":
      return "receipt";
    case "CREDIT_NOTE":
      return "credit-note";
  }
}

async function syncOrderDocumentPdfToR2(
  client: DbClient,
  orderId: string,
  document: {
    id: string;
    type: OrderDocumentType;
    documentNumber: string;
    verificationCode: string;
    issuedAt: Date;
    pdfUrl: string | null;
  },
) {
  if (document.pdfUrl && !document.pdfUrl.startsWith("/api/")) {
    if (document.type === "INVOICE") {
      await client.order.update({
        where: { id: orderId },
        data: {
          invoiceUrl: document.pdfUrl,
        },
      });
    }

    if (document.type === "CREDIT_NOTE") {
      await client.order.update({
        where: { id: orderId },
        data: {
          creditNoteUrl: document.pdfUrl,
        },
      });
    }

    return document;
  }

  const orderForPdf = await client.order.findUnique({
    where: { id: orderId },
    select: orderPdfSelect,
  });
  if (!orderForPdf) {
    throw new Error("Order PDF source missing");
  }

  const pdfBuffer = await renderOrderAccountingDocumentPdf(orderForPdf, {
    documentNumber: document.documentNumber,
    verificationCode: document.verificationCode,
    type: document.type,
    issuedAt: document.issuedAt,
  });

  const stored = await storeBufferInR2({
    userId: orderForPdf.userId,
    scope: "orders",
    resourceId: orderId,
    kind: "documents",
    body: pdfBuffer,
    contentType: "application/pdf",
    fileName: `${document.documentNumber}.pdf`,
  });

  const updated = await client.orderDocument.update({
    where: { id: document.id },
    data: {
      pdfUrl: stored.ref,
    },
  });

  if (document.type === "INVOICE") {
    await client.order.update({
      where: { id: orderId },
      data: {
        invoiceUrl: stored.ref,
      },
    });
  }

  if (document.type === "CREDIT_NOTE") {
    await client.order.update({
      where: { id: orderId },
      data: {
        creditNoteUrl: stored.ref,
      },
    });
  }

  return updated;
}

export async function activateOrderPurchase(
  client: DbClient,
  order: {
    id: string;
    userId: string;
    organizationId: string | null;
    packageTierId: string;
    smsCount: number;
  },
) {
  const existing = await client.packagePurchase.findFirst({
    where: { transactionId: order.id },
    select: { id: true },
  });

  if (existing) return existing;

  const tier = await client.packageTier.findUnique({
    where: { id: order.packageTierId },
    select: { expiryMonths: true },
  });
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (tier?.expiryMonths ?? 12));

  return client.packagePurchase.create({
    data: {
      userId: order.userId,
      organizationId: order.organizationId,
      tierId: order.packageTierId,
      smsTotal: order.smsCount,
      expiresAt,
      isActive: true,
      transactionId: order.id,
    },
    select: { id: true },
  });
}

export async function ensureOrderDocument(
  client: DbClient,
  order: {
    id: string;
    invoiceNumber?: string | null;
    creditNoteNumber?: string | null;
  },
  type: OrderDocumentType,
) {
  const existing = await client.orderDocument.findFirst({
    where: {
      orderId: order.id,
      type,
      deletedAt: null,
    },
    orderBy: { issuedAt: "desc" },
  });

  if (existing) {
    return syncOrderDocumentPdfToR2(client, order.id, existing);
  }

  const documentNumber = await generateOrderDocumentNumber(ORDER_DOCUMENT_KIND[type], client);
  const created = await client.orderDocument.create({
    data: {
      orderId: order.id,
      type,
      documentNumber,
      pdfUrl: "",
    },
  });

  const apiTypePath = ORDER_DOCUMENT_KIND[type];
  const pdfUrl = `/api/v1/orders/${order.id}/documents/${apiTypePath}`;
  const updated = await client.orderDocument.update({
    where: { id: created.id },
    data: { pdfUrl },
  });

  if (type === "INVOICE") {
    await client.order.update({
      where: { id: order.id },
      data: {
        invoiceNumber: updated.documentNumber,
        invoiceUrl: updated.pdfUrl,
      },
    });
  }

  if (type === "TAX_INVOICE" && !order.invoiceNumber) {
    await client.order.update({
      where: { id: order.id },
      data: {
        invoiceNumber: updated.documentNumber,
        invoiceUrl: updated.pdfUrl,
      },
    });
  }

  if (type === "CREDIT_NOTE" && !order.creditNoteNumber) {
    await client.order.update({
      where: { id: order.id },
      data: {
        creditNoteNumber: updated.documentNumber,
        creditNoteUrl: updated.pdfUrl,
      },
    });
  }

  return syncOrderDocumentPdfToR2(client, order.id, updated);
}
