import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { createInvoiceSchema } from "@/lib/validations";
import { calculateVat, calculateWithWht, round2 } from "@/lib/accounting/vat";
import { numberToThaiText } from "@/lib/accounting/thai-number";
import { generateInvoiceNumber } from "@/lib/accounting/invoice-number";

// POST /api/v1/invoices — create invoice
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { applyRateLimit } = await import("@/lib/rate-limit");
    const rl = await applyRateLimit(session.id, "invoice_create");
    if (rl.blocked) return rl.blocked;

    const body = await req.json();
    const input = createInvoiceSchema.parse(body);

    const invoice = await db.$transaction(async (tx) => {
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
          userId: session.id,
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
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const target = new URL(`/api/invoices${new URL(req.url).search}`, req.url);
    const response = await fetch(target, {
      headers: {
        cookie: req.headers.get("cookie") || "",
        accept: "application/json",
      },
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      headers: new Headers(response.headers),
    });
  } catch (error) {
    return apiError(error);
  }
}
