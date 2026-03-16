/**
 * Quotation PDF Generator
 * Renders ใบเสนอราคา using @react-pdf/renderer
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { QuotationPdf, type QuotationPdfData } from "./quotation-pdf";
import { prisma as db } from "@/lib/db";
import { getCompanyInfo } from "@/lib/env";
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

const companyInfo = getCompanyInfo();
const SELLER_INFO = {
  name: companyInfo.name,
  taxId: companyInfo.taxId,
  address: companyInfo.address,
  phone: companyInfo.phone,
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
