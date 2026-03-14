import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { createElement } from "react";
import {
  InvoicePdf,
  type InvoicePdfData,
} from "@/lib/accounting/pdf/invoice-pdf";
import {
  QuotationPdf,
  type QuotationPdfData,
} from "@/lib/accounting/pdf/quotation-pdf";
import { buildDocumentVerificationAssets } from "@/lib/accounting/pdf/document-verification";
import { numberToThaiText } from "@/lib/accounting/thai-number";

type NumericLike = { toNumber(): number } | number;
type PdfRenderable = Parameters<typeof renderToBuffer>[0];

type OrderPdfRecord = {
  id: string;
  orderNumber: string;
  customerType: "INDIVIDUAL" | "COMPANY";
  packageName: string;
  smsCount: number;
  taxName: string;
  taxId: string;
  taxAddress: string;
  taxBranchType: "HEAD" | "BRANCH";
  taxBranchNumber: string | null;
  netAmount: NumericLike;
  vatAmount: NumericLike;
  totalAmount: NumericLike;
  hasWht: boolean;
  whtAmount: NumericLike;
  payAmount: NumericLike;
  quotationNumber?: string | null;
  invoiceNumber?: string | null;
  expiresAt?: Date;
  paidAt?: Date | null;
  createdAt: Date;
  user?: {
    email?: string | null;
    phone?: string | null;
  } | null;
};

const QUOTATION_SELLER = {
  name: process.env.COMPANY_NAME || "บริษัท เอสเอ็มเอสโอเค จำกัด",
  taxId: process.env.COMPANY_TAX_ID || "0105566000000",
  address:
    process.env.COMPANY_ADDRESS ||
    "123 อาคาร ABC ชั้น 10 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: process.env.COMPANY_PHONE || "LINE: @smsok",
};

const INVOICE_SELLER = {
  ...QUOTATION_SELLER,
  branch: process.env.COMPANY_BRANCH || "สำนักงานใหญ่",
  email: process.env.COMPANY_EMAIL || "billing@smsok.com",
};

const fallbackStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    color: "#111827",
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    width: "38%",
    color: "#6b7280",
  },
  value: {
    width: "60%",
    textAlign: "right",
  },
  note: {
    marginTop: 18,
    fontSize: 9,
    color: "#6b7280",
  },
});

function toNumber(value: NumericLike) {
  return typeof value === "number" ? value : value.toNumber();
}

async function renderPdfElement(element: ReturnType<typeof createElement>) {
  return renderToBuffer(element as unknown as PdfRenderable);
}

function buildOrderItem(order: OrderPdfRecord) {
  const unitPrice = toNumber(order.netAmount);
  return [
    {
      description: `${order.packageName} (${order.smsCount.toLocaleString("th-TH")} SMS)`,
      quantity: 1,
      unitPrice,
      amount: unitPrice,
    },
  ];
}

function buildBuyerBranch(order: OrderPdfRecord) {
  if (order.customerType === "INDIVIDUAL") {
    return null;
  }

  if (order.taxBranchType === "BRANCH" && order.taxBranchNumber) {
    return `สาขา ${order.taxBranchNumber}`;
  }

  return "สำนักงานใหญ่";
}

function buildFallbackPdfElement(
  title: string,
  documentNumber: string,
  rows: Array<[string, string]>,
) {
  const rowElements = rows.map(([label, value], index) =>
    createElement(
      View,
      { key: `${label}-${index}`, style: fallbackStyles.row },
      createElement(Text, { style: fallbackStyles.label }, label),
      createElement(Text, { style: fallbackStyles.value }, value),
    ),
  );

  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: fallbackStyles.page },
      createElement(Text, { style: fallbackStyles.title }, title),
      createElement(Text, { style: fallbackStyles.subtitle }, `เลขที่เอกสาร ${documentNumber}`),
      ...rowElements,
      createElement(
        Text,
        { style: fallbackStyles.note },
        "ระบบใช้ layout สำรองสำหรับ PDF ฉบับนี้เพื่อหลีกเลี่ยงข้อผิดพลาดของ template หลัก",
      ),
    ),
  );
}

async function renderOrderPdfWithFallback(
  title: string,
  documentNumber: string,
  rows: Array<[string, string]>,
  renderPrimary: () => Promise<Buffer>,
) {
  try {
    return await renderPrimary();
  } catch (error) {
    console.error(`[orders/pdf] primary ${title} render failed for ${documentNumber}:`, error);
    const fallbackElement = buildFallbackPdfElement(title, documentNumber, rows);
    const fallbackBuffer = await renderPdfElement(fallbackElement);
    return Buffer.from(fallbackBuffer);
  }
}

async function buildOrderInvoicePdfData(
  order: OrderPdfRecord,
  options: {
    documentNumber: string;
    type: InvoicePdfData["type"];
    issuedAt: Date;
    notes?: string | null;
    isVoid?: boolean;
  },
): Promise<InvoicePdfData> {
  const subtotal = toNumber(order.netAmount);
  const vatAmount = toNumber(order.vatAmount);
  const total = toNumber(order.totalAmount);
  const whtAmount = order.hasWht ? toNumber(order.whtAmount) : null;
  const netPayable = order.hasWht ? toNumber(order.payAmount) : null;
  const verification = await buildDocumentVerificationAssets(options.documentNumber);

  return {
    invoiceNumber: options.documentNumber,
    type: options.type,
    createdAt: options.issuedAt,
    dueDate: options.type === "INVOICE" ? order.expiresAt ?? null : null,
    seller: INVOICE_SELLER,
    buyer: {
      name: order.taxName,
      taxId: order.taxId,
      branch: buildBuyerBranch(order),
      address: order.taxAddress,
      phone: order.user?.phone ?? undefined,
      email: order.user?.email ?? undefined,
    },
    items: buildOrderItem(order),
    subtotal,
    vatRate: 7,
    vatAmount,
    whtRate: order.hasWht ? 3 : null,
    whtAmount,
    total,
    netPayable,
    amountInWords: numberToThaiText(netPayable ?? total),
    verificationUrl: verification.verificationUrl,
    verificationQrDataUrl: verification.verificationQrDataUrl,
    isVoid: options.isVoid ?? false,
    notes: options.notes ?? `อ้างอิงคำสั่งซื้อ ${order.orderNumber}`,
  };
}

export async function renderOrderQuotationPdf(order: OrderPdfRecord) {
  if (!order.quotationNumber) {
    throw new Error("ไม่พบใบเสนอราคาสำหรับคำสั่งซื้อนี้");
  }

  return renderOrderPdfWithFallback(
    "ใบเสนอราคา",
    order.quotationNumber,
    [
      ["เลขที่คำสั่งซื้อ", order.orderNumber],
      ["ผู้ซื้อ", order.taxName],
      ["แพ็กเกจ", order.packageName],
      ["จำนวนข้อความ", order.smsCount.toLocaleString("th-TH")],
      ["ยอดรวม", toNumber(order.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ],
    async () => {
      const total = toNumber(order.totalAmount);
      const vatAmount = toNumber(order.vatAmount);
      const subtotal = toNumber(order.netAmount);

      const data: QuotationPdfData = {
        quotationNumber: order.quotationNumber!,
        createdAt: order.createdAt,
        validUntil: order.expiresAt ?? order.createdAt,
        seller: QUOTATION_SELLER,
        buyer: {
          name: order.taxName,
          address: order.taxAddress,
          phone: order.user?.phone ?? undefined,
          email: order.user?.email ?? undefined,
        },
        items: buildOrderItem(order),
        subtotal,
        vatRate: 7,
        vatAmount,
        total,
        amountInWords: numberToThaiText(total),
        notes: `อ้างอิงคำสั่งซื้อ ${order.orderNumber}`,
      };

      const element = createElement(QuotationPdf, { data });
      const buffer = await renderPdfElement(element);
      return Buffer.from(buffer);
    },
  );
}

export async function renderOrderInvoicePdf(order: OrderPdfRecord) {
  if (!order.invoiceNumber) {
    throw new Error("ไม่พบใบกำกับภาษีสำหรับคำสั่งซื้อนี้");
  }

  return renderOrderPdfWithFallback(
    "ใบกำกับภาษี / ใบเสร็จรับเงิน",
    order.invoiceNumber,
    [
      ["เลขที่คำสั่งซื้อ", order.orderNumber],
      ["ผู้ซื้อ", order.taxName],
      ["แพ็กเกจ", order.packageName],
      ["ยอดรวม", toNumber(order.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
      ["ยอดชำระสุทธิ", toNumber(order.payAmount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ],
    async () => {
      const data = await buildOrderInvoicePdfData(order, {
        documentNumber: order.invoiceNumber!,
        type: "TAX_INVOICE_RECEIPT",
        issuedAt: order.paidAt ?? order.createdAt,
      });

      const element = createElement(InvoicePdf, { data });
      const buffer = await renderPdfElement(element);
      return Buffer.from(buffer);
    },
  );
}

export async function renderOrderAccountingDocumentPdf(
  order: OrderPdfRecord,
  options: {
    documentNumber: string;
    type: "INVOICE" | "TAX_INVOICE" | "RECEIPT" | "CREDIT_NOTE";
    issuedAt: Date;
    notes?: string | null;
    isVoid?: boolean;
  },
) {
  return renderOrderPdfWithFallback(
    options.type,
    options.documentNumber,
    [
      ["เลขที่คำสั่งซื้อ", order.orderNumber],
      ["ผู้ซื้อ", order.taxName],
      ["แพ็กเกจ", order.packageName],
      ["ยอดรวม", toNumber(order.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
    ],
    async () => {
      const data = await buildOrderInvoicePdfData(order, options);
      const element = createElement(InvoicePdf, { data });
      const buffer = await renderPdfElement(element);
      return Buffer.from(buffer);
    },
  );
}
