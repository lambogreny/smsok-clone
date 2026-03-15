import {
  type OrderDocumentType,
  type OrderStatus,
  type PrismaClient,
} from "@prisma/client";
import { calculateVat, calculateWithWht } from "@/lib/accounting/vat";
import { prisma as db } from "@/lib/db";
import { isSlipRejectCode } from "@/lib/orders/rejected-slip";
import { resolveStoredFilePublicUrl, resolveStoredFileUrl } from "@/lib/storage/files";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type DbClient = PrismaClient | TxClient;

type OrderRecord = {
  id: string;
  orderNumber: string;
  packageTierId: string;
  packageName: string;
  smsCount: number;
  customerType: "INDIVIDUAL" | "COMPANY";
  taxName: string;
  taxId: string;
  taxAddress: string;
  taxBranchType: "HEAD" | "BRANCH";
  taxBranchNumber: string | null;
  netAmount: { toNumber(): number } | number;
  vatAmount: { toNumber(): number } | number;
  totalAmount: { toNumber(): number } | number;
  hasWht: boolean;
  whtAmount: { toNumber(): number } | number;
  payAmount: { toNumber(): number } | number;
  status: OrderStatus;
  expiresAt: Date;
  quotationNumber: string | null;
  quotationUrl: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  slipUrl: string | null;
  whtCertUrl: string | null;
  easyslipVerified: boolean | null;
  rejectReason: string | null;
  rejectMessage: string | null;
  rejectedAt: Date | null;
  slipAttemptCount: number;
  adminNote: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
};

type OrderDocumentRecord = {
  id: string;
  type: OrderDocumentType;
  documentNumber: string;
  verificationCode?: string;
  issuedAt: Date;
  voidedAt: Date | null;
  voidReason: string | null;
  replacesDocumentId: string | null;
  pdfUrl: string | null;
  deletedAt: Date | null;
};

type OrderHistoryRecord = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: Date;
};

type OrderSlipRecord = {
  id: string;
  fileUrl: string;
  fileKey: string;
  fileSize: number | null;
  fileType: string | null;
  uploadedAt: Date;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  deletedAt: Date | null;
};

type OrderSerializeInput = OrderRecord & {
  documents?: OrderDocumentRecord[];
  history?: OrderHistoryRecord[];
  slips?: OrderSlipRecord[];
};

export type LegacyOrderStatus =
  | "PENDING"
  | "SLIP_UPLOADED"
  | "VERIFIED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED";

export type OrderApiStatus =
  | "draft"
  | "pending_payment"
  | "verifying"
  | "paid"
  | "expired"
  | "cancelled";

export type OrderDocumentApiType =
  | "invoice"
  | "tax_invoice"
  | "receipt"
  | "credit_note";

const ORDER_STATUS_TO_API: Record<OrderStatus, OrderApiStatus> = {
  DRAFT: "draft",
  PENDING_PAYMENT: "pending_payment",
  VERIFYING: "verifying",
  PAID: "paid",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

const ORDER_STATUS_TO_LEGACY: Record<OrderStatus, LegacyOrderStatus> = {
  DRAFT: "PENDING",
  PENDING_PAYMENT: "PENDING",
  VERIFYING: "PENDING_REVIEW",
  PAID: "COMPLETED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

const LEGACY_STATUS_TO_DB: Record<LegacyOrderStatus, OrderStatus[]> = {
  PENDING: ["DRAFT", "PENDING_PAYMENT"],
  SLIP_UPLOADED: ["VERIFYING"],
  VERIFIED: ["PAID"],
  PENDING_REVIEW: ["VERIFYING"],
  APPROVED: ["PAID"],
  COMPLETED: ["PAID"],
  EXPIRED: ["EXPIRED"],
  CANCELLED: ["CANCELLED"],
  REJECTED: ["PENDING_PAYMENT"],
};

const API_STATUS_TO_DB: Record<OrderApiStatus, OrderStatus> = {
  draft: "DRAFT",
  pending_payment: "PENDING_PAYMENT",
  verifying: "VERIFYING",
  paid: "PAID",
  expired: "EXPIRED",
  cancelled: "CANCELLED",
};

const ORDER_DOCUMENT_TYPE_TO_API: Record<OrderDocumentType, OrderDocumentApiType> = {
  INVOICE: "invoice",
  TAX_INVOICE: "tax_invoice",
  RECEIPT: "receipt",
  CREDIT_NOTE: "credit_note",
};

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export function serializeLegacyOrderStatus(status: OrderStatus): LegacyOrderStatus {
  return ORDER_STATUS_TO_LEGACY[status];
}

export function serializeOrderStatus(status: OrderStatus): OrderApiStatus {
  return ORDER_STATUS_TO_API[status];
}

export function parseLegacyOrderStatus(status: string | undefined) {
  if (!status) return null;
  return LEGACY_STATUS_TO_DB[status as LegacyOrderStatus] ?? null;
}

export function parseOrderStatus(status: string | undefined) {
  if (!status) return null;
  const mapped = API_STATUS_TO_DB[status as OrderApiStatus];
  return mapped ? [mapped] : null;
}

export function isWhtEligible(netAmount: number, customerType: "INDIVIDUAL" | "COMPANY") {
  return customerType === "COMPANY" && netAmount >= 1000;
}

export function getOrderExpirationDate(method: "promptpay" | "bank_transfer" = "bank_transfer") {
  const now = Date.now();
  const durationMs = method === "promptpay" ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  return new Date(now + durationMs);
}

export function calculateOrderAmounts(priceBeforeVat: number, hasWht: boolean) {
  if (hasWht) {
    const totals = calculateWithWht(priceBeforeVat);
    return {
      netAmount: totals.subtotal,
      vatAmount: totals.vat,
      totalAmount: totals.total,
      whtAmount: totals.wht3pct,
      payAmount: totals.netPayable,
    };
  }
  const totals = calculateVat(priceBeforeVat);
  const netAmount = totals.subtotal;
  const vatAmount = totals.vat7pct;
  const totalAmount = totals.total;
  const whtAmount = 0;
  const payAmount = totals.total;

  return {
    netAmount,
    vatAmount,
    totalAmount,
    whtAmount,
    payAmount,
  };
}

export async function getUserPrimaryOrganizationId(userId: string, client: DbClient = db) {
  const membership = await client.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { organizationId: true },
  });

  return membership?.organizationId ?? null;
}

export async function createOrderHistory(
  client: DbClient,
  orderId: string,
  toStatus: OrderStatus,
  options?: {
    fromStatus?: OrderStatus | null;
    changedBy?: string | null;
    note?: string | null;
  },
) {
  await client.orderHistory.create({
    data: {
      orderId,
      fromStatus: options?.fromStatus ?? null,
      toStatus,
      changedBy: options?.changedBy ?? null,
      note: options?.note ?? null,
    },
  });
}

export async function upsertDefaultCompanyTaxProfile(
  client: DbClient,
  userId: string,
  organizationId: string | null,
  input: {
    companyName: string;
    taxId: string;
    address: string;
    branchType: "HEAD" | "BRANCH";
    branchNumber?: string | null;
  },
) {
  const existing = await client.taxProfile.findFirst({
    where: {
      userId,
      organizationId,
      isDefault: true,
    },
    select: { id: true },
  });

  if (existing) {
    return client.taxProfile.update({
      where: { id: existing.id },
      data: {
        companyName: input.companyName,
        taxId: input.taxId,
        address: input.address,
        branchType: input.branchType,
        branchNumber: input.branchType === "HEAD" ? null : input.branchNumber ?? null,
        isDefault: true,
      },
      select: { id: true },
    });
  }

  return client.taxProfile.create({
    data: {
      userId,
      organizationId,
      companyName: input.companyName,
      taxId: input.taxId,
      address: input.address,
      branchType: input.branchType,
      branchNumber: input.branchType === "HEAD" ? null : input.branchNumber ?? null,
      isDefault: true,
    },
    select: { id: true },
  });
}

function attachOrderDocuments(
  payload: Record<string, unknown>,
  documents: OrderDocumentRecord[] | undefined,
) {
  if (!documents?.length) {
    return payload;
  }

  const activeDocuments = documents.filter((document) => !document.deletedAt);
  const invoice = activeDocuments.find((document) => document.type === "INVOICE");
  const taxInvoice = activeDocuments.find((document) => document.type === "TAX_INVOICE");
  const receipt = activeDocuments.find((document) => document.type === "RECEIPT");
  const invoiceUrl = resolveStoredFilePublicUrl(invoice?.pdfUrl) ?? invoice?.pdfUrl;
  const taxInvoiceUrl = resolveStoredFilePublicUrl(taxInvoice?.pdfUrl) ?? taxInvoice?.pdfUrl;
  const receiptUrl = resolveStoredFilePublicUrl(receipt?.pdfUrl) ?? receipt?.pdfUrl;
  const shouldReplaceInvoiceUrl =
    typeof payload.invoice_url !== "string" || payload.invoice_url.startsWith("/api/");

  return {
    ...payload,
    ...(invoice && (!payload.invoice_number || shouldReplaceInvoiceUrl)
      ? { invoice_number: invoice.documentNumber, invoice_url: invoiceUrl }
      : {}),
    tax_invoice_number: taxInvoice?.documentNumber ?? undefined,
    tax_invoice_url: taxInvoiceUrl ?? undefined,
    receipt_number: receipt?.documentNumber ?? undefined,
    receipt_url: receiptUrl ?? undefined,
    documents: activeDocuments.map(serializeOrderDocument),
  };
}

function attachOrderTimeline(
  payload: Record<string, unknown>,
  history: OrderHistoryRecord[] | undefined,
) {
  if (!history?.length) {
    return payload;
  }

  return {
    ...payload,
    timeline: history.map((event) => ({
      status: serializeLegacyOrderStatus(event.toStatus),
      timestamp: event.createdAt.toISOString(),
    })),
  };
}

function attachLatestSlip(
  payload: Record<string, unknown>,
  slips: OrderSlipRecord[] | undefined,
) {
  if (!slips?.length) {
    return payload;
  }

  const latestSlip = [...slips]
    .filter((slip) => !slip.deletedAt)
    .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
    .at(-1);

  if (!latestSlip) {
    return payload;
  }

  return {
    ...payload,
    latest_slip_uploaded_at: latestSlip.uploadedAt.toISOString(),
  };
}

function attachLatestStatusNote(
  payload: Record<string, unknown>,
  history: OrderHistoryRecord[] | undefined,
) {
  const latestNote = [...(history ?? [])]
    .reverse()
    .find((event) => event.note?.trim())?.note;

  if (!latestNote) {
    return payload;
  }

  return {
    ...payload,
    latest_status_note: latestNote,
  };
}

function getOrderRejectCode(order: OrderRecord) {
  return isSlipRejectCode(order.rejectReason) ? order.rejectReason : undefined;
}

function getOrderRejectMessage(order: OrderRecord) {
  if (order.rejectMessage?.trim()) {
    return order.rejectMessage;
  }

  return isSlipRejectCode(order.rejectReason) ? undefined : order.rejectReason ?? undefined;
}

export function serializeOrder(order: OrderSerializeInput) {
  const rejectCode = getOrderRejectCode(order);
  const rejectMessage = getOrderRejectMessage(order);
  const base = {
    id: order.id,
    order_number: order.orderNumber,
    package_tier_id: order.packageTierId,
    package_name: order.packageName,
    sms_count: order.smsCount,
    customer_type: order.customerType,
    company_name: order.customerType === "COMPANY" ? order.taxName : undefined,
    company_address: order.customerType === "COMPANY" ? order.taxAddress : undefined,
    tax_name: order.taxName,
    tax_id: order.taxId,
    tax_address: order.taxAddress,
    tax_branch_type: order.taxBranchType,
    tax_branch_number: order.taxBranchNumber ?? undefined,
    net_amount: toNumber(order.netAmount),
    vat_amount: toNumber(order.vatAmount),
    total_amount: toNumber(order.totalAmount),
    has_wht: order.hasWht,
    wht_applicable: order.hasWht,
    wht_amount: toNumber(order.whtAmount),
    pay_amount: toNumber(order.payAmount),
    status: order.status === "PENDING_PAYMENT" && (rejectCode || rejectMessage)
      ? "REJECTED" as LegacyOrderStatus
      : serializeLegacyOrderStatus(order.status),
    expires_at: order.expiresAt.toISOString(),
    quotation_number: order.quotationNumber ?? undefined,
    quotation_url: order.quotationUrl ?? undefined,
    invoice_number: order.invoiceNumber ?? undefined,
    invoice_url: resolveStoredFilePublicUrl(order.invoiceUrl) ?? order.invoiceUrl ?? undefined,
    slip_url: resolveStoredFileUrl(order.slipUrl) ?? undefined,
    wht_cert_url: resolveStoredFileUrl(order.whtCertUrl) ?? undefined,
    easyslip_verified: order.easyslipVerified ?? undefined,
    reject_reason: rejectMessage ?? rejectCode,
    reject_code: rejectCode,
    reject_message: rejectMessage,
    rejected_at: order.rejectedAt?.toISOString(),
    slip_attempt_count: order.slipAttemptCount,
    admin_note: order.adminNote ?? undefined,
    paid_at: order.paidAt?.toISOString(),
    cancelled_at: order.cancelledAt?.toISOString(),
    cancellation_reason: order.cancellationReason ?? undefined,
    created_at: order.createdAt.toISOString(),
  };

  return attachLatestStatusNote(
    attachOrderTimeline(
      attachLatestSlip(
        attachOrderDocuments(base, order.documents),
        order.slips,
      ),
      order.history,
    ),
    order.history,
  );
}

export function serializeOrderV2(order: OrderSerializeInput) {
  const rejectCode = getOrderRejectCode(order);
  const rejectMessage = getOrderRejectMessage(order);
  const base = {
    id: order.id,
    order_number: order.orderNumber,
    package_tier_id: order.packageTierId,
    package_name: order.packageName,
    sms_count: order.smsCount,
    customer_type: order.customerType,
    company_name: order.customerType === "COMPANY" ? order.taxName : undefined,
    company_address: order.customerType === "COMPANY" ? order.taxAddress : undefined,
    tax_name: order.taxName,
    tax_id: order.taxId,
    tax_address: order.taxAddress,
    tax_branch_type: order.taxBranchType,
    tax_branch_number: order.taxBranchNumber ?? undefined,
    net_amount: toNumber(order.netAmount),
    vat_amount: toNumber(order.vatAmount),
    total_amount: toNumber(order.totalAmount),
    has_wht: order.hasWht,
    wht_applicable: order.hasWht,
    wht_amount: toNumber(order.whtAmount),
    pay_amount: toNumber(order.payAmount),
    status: serializeOrderStatus(order.status),
    expires_at: order.expiresAt.toISOString(),
    quotation_number: order.quotationNumber ?? undefined,
    quotation_url: order.quotationUrl ?? undefined,
    invoice_number: order.invoiceNumber ?? undefined,
    invoice_url: resolveStoredFilePublicUrl(order.invoiceUrl) ?? order.invoiceUrl ?? undefined,
    slip_url: resolveStoredFileUrl(order.slipUrl) ?? undefined,
    wht_cert_url: resolveStoredFileUrl(order.whtCertUrl) ?? undefined,
    easyslip_verified: order.easyslipVerified ?? undefined,
    reject_reason: rejectMessage ?? rejectCode,
    reject_code: rejectCode,
    reject_message: rejectMessage,
    rejected_at: order.rejectedAt?.toISOString(),
    slip_attempt_count: order.slipAttemptCount,
    admin_note: order.adminNote ?? undefined,
    paid_at: order.paidAt?.toISOString(),
    cancelled_at: order.cancelledAt?.toISOString(),
    cancellation_reason: order.cancellationReason ?? undefined,
    created_at: order.createdAt.toISOString(),
  };

  return attachLatestStatusNote(
    attachLatestSlip(base, order.slips),
    order.history,
  );
}

export function serializeOrderDocument(document: OrderDocumentRecord) {
  return {
    id: document.id,
    type: ORDER_DOCUMENT_TYPE_TO_API[document.type],
    document_number: document.documentNumber,
    issued_at: document.issuedAt.toISOString(),
    voided_at: document.voidedAt?.toISOString(),
    void_reason: document.voidReason ?? undefined,
    replaces_document_id: document.replacesDocumentId ?? undefined,
    url: resolveStoredFilePublicUrl(document.pdfUrl) ?? document.pdfUrl ?? undefined,
    pdf_url: resolveStoredFilePublicUrl(document.pdfUrl) ?? document.pdfUrl ?? undefined,
    deleted_at: document.deletedAt?.toISOString(),
  };
}

export function serializeOrderSlip(slip: OrderSlipRecord) {
  return {
    id: slip.id,
    file_url: resolveStoredFileUrl(slip.fileUrl) ?? slip.fileUrl,
    file_key: slip.fileKey,
    file_size: slip.fileSize ?? undefined,
    file_type: slip.fileType ?? undefined,
    uploaded_at: slip.uploadedAt.toISOString(),
    verified_at: slip.verifiedAt?.toISOString(),
    verified_by: slip.verifiedBy ?? undefined,
    deleted_at: slip.deletedAt?.toISOString(),
  };
}
