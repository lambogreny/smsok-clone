/**
 * Invoice PDF Generator
 * Renders Thai Tax Invoice using @react-pdf/renderer
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { InvoicePdf, type InvoicePdfData } from "./invoice-pdf";
import { prisma as db } from "@/lib/db";
import { decryptSecret } from "@/lib/two-factor";
import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  amount: z.number(),
});

const invoiceItemsSchema = z.array(invoiceItemSchema);

// Seller info — company operating SMSOK
const SELLER_INFO = {
  name: process.env.COMPANY_NAME || "บริษัท เอสเอ็มเอสโอเค จำกัด",
  taxId: process.env.COMPANY_TAX_ID || "0105566000000",
  branch: process.env.COMPANY_BRANCH || "สำนักงานใหญ่",
  address: process.env.COMPANY_ADDRESS || "123 อาคาร ABC ชั้น 10 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: process.env.COMPANY_PHONE || "02-xxx-xxxx",
  email: process.env.COMPANY_EMAIL || "billing@smsok.com",
};

/**
 * Generate PDF buffer for an invoice
 */
export async function generateInvoicePdf(invoiceId: string): Promise<Buffer> {
  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      user: {
        include: {
          billingInfo: true,
        },
      },
    },
  });

  // Build buyer info from billing info or fallback to user info
  const billing = invoice.user.billingInfo;
  const buyer = billing
    ? {
        name:
          billing.accountType === "CORPORATION"
            ? billing.companyName!
            : billing.fullName!,
        taxId: billing.taxId ? decryptSecret(billing.taxId) : null,
        branch:
          billing.accountType === "CORPORATION"
            ? billing.branchName || `${billing.branchCode}` || "สำนักงานใหญ่"
            : null,
        address: billing.address,
        phone: billing.phone,
        email: billing.email,
      }
    : {
        name: invoice.user.name,
        taxId: null,
        branch: null,
        address: "-",
        phone: invoice.user.phone || undefined,
        email: invoice.user.email,
      };

  const itemsParsed = invoiceItemsSchema.safeParse(invoice.items);
  if (!itemsParsed.success) {
    throw new Error(`ข้อมูลรายการในใบกำกับภาษีไม่ถูกต้อง (invoice ${invoice.invoiceNumber}): ${itemsParsed.error.message}`);
  }
  const items = itemsParsed.data;

  const pdfData: InvoicePdfData = {
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type as InvoicePdfData["type"],
    createdAt: invoice.createdAt,
    dueDate: invoice.dueDate,
    seller: SELLER_INFO,
    buyer,
    items,
    subtotal: Number(invoice.subtotal),
    vatRate: Number(invoice.vatRate),
    vatAmount: Number(invoice.vatAmount),
    whtRate: invoice.whtRate ? Number(invoice.whtRate) : null,
    whtAmount: invoice.whtAmount ? Number(invoice.whtAmount) : null,
    total: Number(invoice.total),
    netPayable: invoice.netPayable ? Number(invoice.netPayable) : null,
    amountInWords: invoice.amountInWords || "",
    notes: invoice.notes,
  };

  const element = createElement(InvoicePdf, { data: pdfData });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
