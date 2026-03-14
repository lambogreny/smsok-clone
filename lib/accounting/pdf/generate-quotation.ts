/**
 * Quotation PDF Generator
 * Renders ใบเสนอราคา using @react-pdf/renderer
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotationPdf, type QuotationPdfData } from "./quotation-pdf";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

type PdfRenderable = Parameters<typeof renderToBuffer>[0];

async function renderPdfElement(element: ReturnType<typeof createElement>) {
  return renderToBuffer(element as unknown as PdfRenderable);
}

const quotationItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  amount: z.number(),
});

const SELLER_INFO = {
  name: process.env.COMPANY_NAME || "บริษัท เอสเอ็มเอสโอเค จำกัด",
  taxId: process.env.COMPANY_TAX_ID || "0105566000000",
  address: process.env.COMPANY_ADDRESS || "123 อาคาร ABC ชั้น 10 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: process.env.COMPANY_PHONE || "LINE: @smsok",
};

export async function generateQuotationPdf(quotationId: string): Promise<Buffer> {
  const quotation = await db.quotation.findUniqueOrThrow({
    where: { id: quotationId },
  });

  const itemsParsed = z.array(quotationItemSchema).safeParse(quotation.items);
  if (!itemsParsed.success) {
    throw new Error(`ข้อมูลรายการในใบเสนอราคาไม่ถูกต้อง (${quotation.quotationNumber}): ${itemsParsed.error.message}`);
  }
  const items = itemsParsed.data;

  const pdfData: QuotationPdfData = {
    quotationNumber: quotation.quotationNumber,
    createdAt: quotation.createdAt,
    validUntil: quotation.validUntil,
    seller: SELLER_INFO,
    buyer: {
      name: quotation.buyerName,
      address: quotation.buyerAddress,
      phone: quotation.buyerPhone ?? undefined,
      email: quotation.buyerEmail ?? undefined,
    },
    items,
    subtotal: Number(quotation.subtotal),
    vatRate: Number(quotation.vatRate),
    vatAmount: Number(quotation.vatAmount),
    total: Number(quotation.total),
    amountInWords: quotation.amountInWords || "",
    notes: quotation.notes,
  };

  const element = createElement(QuotationPdf, { data: pdfData });
  const buffer = await renderPdfElement(element);
  return Buffer.from(buffer);
}
