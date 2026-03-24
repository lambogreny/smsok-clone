import { NextRequest } from "next/server";
import { apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { ensurePaymentDocumentNumber } from "@/lib/payments/documents";
import { createInvoiceSchema } from "@/lib/validations";
import { calculateVat, calculateWithWht, round2 } from "@/lib/accounting/vat";
import { numberToThaiText } from "@/lib/accounting/thai-number";
import { generateInvoiceNumber } from "@/lib/accounting/invoice-number";

// POST /api/v1/invoices — create invoice
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const body = await req.json();
    const input = createInvoiceSchema.parse(body);

    const invoice = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const invoiceNumber = await generateInvoiceNumber(input.type, tx);

      const calc = input.applyWht
        ? calculateWithWht(input.subtotal)
        : calculateVat(input.subtotal);

      const vatAmount = input.applyWht
        ? (calc as ReturnType<typeof calculateWithWht>).vat
        : (calc as ReturnType<typeof calculateVat>).vat7pct;
      const whtAmount = input.applyWht
        ? (calc as ReturnType<typeof calculateWithWht>).wht3pct
        : null;
      const netPayable = input.applyWht
        ? (calc as ReturnType<typeof calculateWithWht>).netPayable
        : null;
      const total = calc.total;
      const amountInWords = numberToThaiText(netPayable ?? total);

      return tx.invoice.create({
        data: {
          userId: user.id,
          transactionId: input.transactionId,
          invoiceNumber,
          type: input.type,
          status: "DRAFT",
          items: input.items,
          subtotal: round2(input.subtotal),
          vatRate: 7,
          vatAmount: round2(vatAmount),
          whtRate: input.applyWht ? 3 : null,
          whtAmount: whtAmount != null ? round2(whtAmount) : null,
          total: round2(total),
          netPayable: netPayable != null ? round2(netPayable) : null,
          amountInWords,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          notes: input.notes,
        },
      });
    });

    return apiResponse(invoice, 201);
  } catch (error) {
    return apiError(error);
  }
}

// GET /api/v1/invoices — list invoices
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10)));

    const where: NonNullable<Parameters<typeof db.payment.findMany>[0]>["where"] = {
      userId: user.id,
      status: { in: ["COMPLETED", "REFUNDED"] },
    };

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          createdAt: true,
          paidAt: true,
          amount: true,
          vatAmount: true,
          totalAmount: true,
          invoiceNumber: true,
          invoiceUrl: true,
        },
      }),
      db.payment.count({ where }),
    ]);

    const invoices = [];
    for (const payment of payments) {
      const invoiceNumber =
        payment.invoiceNumber ??
        (await ensurePaymentDocumentNumber(payment.id, "invoice"));

      invoices.push({
        id: payment.id,
        invoiceNumber,
        createdAt: payment.paidAt ?? payment.createdAt,
        subtotal: payment.amount / 100,
        vatAmount: (payment.vatAmount ?? 0) / 100,
        total: (payment.totalAmount ?? 0) / 100,
        status: payment.status === "COMPLETED" ? "PAID" : "VOIDED",
        downloadUrl: invoiceNumber ? `/api/v1/invoices/${payment.id}/pdf` : null,
      });
    }

    return apiResponse({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
