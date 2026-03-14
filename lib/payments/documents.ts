import { Prisma, type PrismaClient } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma as db } from "@/lib/db";
import { numberToThaiText } from "@/lib/accounting/thai-number";
import { InvoicePdf, type InvoicePdfData } from "@/lib/accounting/pdf/invoice-pdf";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type DbClient = PrismaClient | TxClient;
type PdfRenderable = Parameters<typeof renderToBuffer>[0];

async function renderPdfElement(element: ReturnType<typeof createElement>) {
  return renderToBuffer(element as unknown as PdfRenderable);
}

export type PaymentDocumentKind = "pre-invoice" | "invoice" | "credit-note";

export type PaymentDocumentRecord = {
  id: string;
  userId: string;
  createdAt: Date;
  paidAt: Date | null;
  refundedAt: Date | null;
  expiresAt: Date | null;
  amount: number;
  vatAmount: number | null;
  totalAmount: number | null;
  hasWht: boolean;
  whtAmount: number | null;
  netPayAmount: number | null;
  preInvoiceNumber: string | null;
  invoiceNumber: string | null;
  creditNoteNumber: string | null;
  packageTier: {
    name: string;
    tierCode: string;
    totalSms: number;
  } | null;
  taxProfile: {
    companyName: string;
    taxId: string;
    address: string;
    branchType: string;
    branchNumber: string | null;
  } | null;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
};

const SELLER_INFO = {
  name: process.env.COMPANY_NAME || "บริษัท เอสเอ็มเอสโอเค จำกัด",
  taxId: process.env.COMPANY_TAX_ID || "0105566000000",
  branch: process.env.COMPANY_BRANCH || "สำนักงานใหญ่",
  address:
    process.env.COMPANY_ADDRESS ||
    "123 อาคาร ABC ชั้น 10 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: process.env.COMPANY_PHONE || "LINE: @smsok",
  email: process.env.COMPANY_EMAIL || "billing@smsok.com",
};

function nowYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

function satangToBaht(amount: number | null | undefined) {
  return ((amount ?? 0) / 100);
}

function getSequenceType(kind: PaymentDocumentKind) {
  switch (kind) {
    case "pre-invoice":
      return "QUOTATION" as const;
    case "invoice":
      return "INVOICE" as const;
    case "credit-note":
      return "CREDIT_NOTE" as const;
  }
}

function getSequencePrefix(kind: PaymentDocumentKind) {
  switch (kind) {
    case "pre-invoice":
      return "QT";
    case "invoice":
      return "INV";
    case "credit-note":
      return "CN";
  }
}

function getPaymentField(kind: PaymentDocumentKind) {
  switch (kind) {
    case "pre-invoice":
      return "preInvoiceNumber";
    case "invoice":
      return "invoiceNumber";
    case "credit-note":
      return "creditNoteNumber";
  }
}

function getPdfType(kind: PaymentDocumentKind): InvoicePdfData["type"] {
  switch (kind) {
    case "pre-invoice":
      return "QUOTATION";
    case "invoice":
      return "TAX_INVOICE";
    case "credit-note":
      return "CREDIT_NOTE";
  }
}

function getBuyerBranch(profile: PaymentDocumentRecord["taxProfile"]) {
  if (!profile) return null;
  if (profile.branchType === "HEAD") return "สำนักงานใหญ่";
  return profile.branchNumber ? `สาขา ${profile.branchNumber}` : "สาขา";
}

function getDocumentDate(payment: PaymentDocumentRecord, kind: PaymentDocumentKind) {
  switch (kind) {
    case "invoice":
      return payment.paidAt ?? payment.createdAt;
    case "credit-note":
      return payment.refundedAt ?? payment.createdAt;
    case "pre-invoice":
      return payment.createdAt;
  }
}

function getDueDate(payment: PaymentDocumentRecord, kind: PaymentDocumentKind) {
  if (kind !== "pre-invoice") return null;
  return payment.expiresAt ?? null;
}

export function calculatePaymentAmounts(amountSatang: number, hasWht: boolean) {
  const vatAmount = Math.round(amountSatang * 0.07);
  const totalAmount = amountSatang + vatAmount;
  const whtAmount = hasWht ? Math.round(amountSatang * 0.03) : 0;
  const netPayAmount = totalAmount - whtAmount;

  return {
    amountSatang,
    vatAmount,
    totalAmount,
    whtAmount,
    netPayAmount,
  };
}

export async function getUserPrimaryOrganizationId(userId: string, client: DbClient = db) {
  const membership = await client.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });

  return membership?.organizationId ?? null;
}

export async function generatePaymentDocumentNumber(
  kind: PaymentDocumentKind,
  client: DbClient = db,
) {
  const yearMonth = nowYearMonth();
  const type = getSequenceType(kind);
  const sequence = await client.documentSequence.upsert({
    where: {
      type_year: {
        type,
        year: Number.parseInt(yearMonth, 10),
      },
    },
    update: {
      lastNumber: {
        increment: 1,
      },
    },
    create: {
      type,
      year: Number.parseInt(yearMonth, 10),
      lastNumber: 1,
    },
  });

  return `${getSequencePrefix(kind)}-${yearMonth}-${String(sequence.lastNumber).padStart(5, "0")}`;
}

export async function ensurePaymentDocumentNumber(
  paymentId: string,
  kind: PaymentDocumentKind,
  client: DbClient = db,
) {
  const payment = await client.payment.findUnique({
    where: { id: paymentId },
    select: {
      preInvoiceNumber: true,
      invoiceNumber: true,
      creditNoteNumber: true,
    },
  });

  if (!payment) {
    throw new Error("ไม่พบรายการชำระเงิน");
  }

  const field = getPaymentField(kind);
  const existing = payment[field];
  if (existing) return existing;

  const documentNumber = await generatePaymentDocumentNumber(kind, client);
  const data = {
    [field]: documentNumber,
  } as Prisma.PaymentUpdateInput;

  await client.payment.update({
    where: { id: paymentId },
    data,
  });

  return documentNumber;
}

export function buildPaymentPdfData(
  payment: PaymentDocumentRecord,
  kind: PaymentDocumentKind,
  documentNumber: string,
): InvoicePdfData {
  const subtotal = satangToBaht(payment.amount);
  const vatAmount = satangToBaht(payment.vatAmount);
  const totalAmount = satangToBaht(payment.totalAmount);
  const whtAmount = satangToBaht(payment.whtAmount);
  const netPayAmount = satangToBaht(payment.netPayAmount || payment.totalAmount);
  const amountInWords =
    kind === "pre-invoice" ? numberToThaiText(netPayAmount) : numberToThaiText(totalAmount);

  const packageName = payment.packageTier?.name || "SMS Package";
  const tierCode = payment.packageTier?.tierCode || "-";
  const totalSms = payment.packageTier?.totalSms ?? 0;

  const notesByKind: Record<PaymentDocumentKind, string | null> = {
    "pre-invoice": payment.hasWht
      ? "ยอดชำระสุทธินี้คำนวณหลังหักภาษี ณ ที่จ่าย 3% จากราคาก่อน VAT แล้ว"
      : "กรุณาชำระเงินภายในเวลาที่กำหนดเพื่อยืนยันการเปิดใช้งานแพ็กเกจ",
    invoice: payment.hasWht
      ? "เอกสารฉบับนี้แสดงยอดเต็มก่อนหักภาษี ณ ที่จ่าย 3% ตามมาตรฐานบัญชี"
      : null,
    "credit-note": payment.invoiceNumber
      ? `อ้างอิงใบกำกับภาษีเลขที่ ${payment.invoiceNumber}`
      : "อ้างอิงรายการคืนเงินของคำสั่งซื้อเดิม",
  };

  return {
    invoiceNumber: documentNumber,
    type: getPdfType(kind),
    createdAt: getDocumentDate(payment, kind),
    dueDate: getDueDate(payment, kind),
    seller: SELLER_INFO,
    buyer: {
      name: payment.taxProfile?.companyName ?? payment.user.name ?? payment.user.email,
      taxId: payment.taxProfile?.taxId ?? null,
      branch: getBuyerBranch(payment.taxProfile),
      address: payment.taxProfile?.address ?? "-",
      phone: payment.user.phone ?? undefined,
      email: payment.user.email,
    },
    items: [
      {
        description: `แพ็กเกจ ${packageName} (${tierCode}) ${totalSms.toLocaleString("th-TH")} SMS`,
        quantity: 1,
        unitPrice: subtotal,
        amount: subtotal,
      },
    ],
    subtotal,
    vatRate: 7,
    vatAmount,
    whtRate: payment.hasWht ? 3 : null,
    whtAmount: payment.hasWht ? whtAmount : null,
    total: totalAmount,
    netPayable: payment.hasWht ? netPayAmount : null,
    amountInWords,
    notes: notesByKind[kind],
  };
}

export async function renderPaymentDocumentPdf(
  payment: PaymentDocumentRecord,
  kind: PaymentDocumentKind,
  documentNumber: string,
) {
  const element = createElement(InvoicePdf, {
    data: buildPaymentPdfData(payment, kind, documentNumber),
  });

  const buffer = await renderPdfElement(element);
  return Buffer.from(buffer);
}
