import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/quotations/:id/pdf — download quotation PDF
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { id } = await ctx.params;

    // Verify ownership
    const quotation = await db.quotation.findFirst({
      where: { id, userId: session.id },
      select: { id: true, quotationNumber: true },
    });
    if (!quotation) throw new ApiError(404, "ไม่พบใบเสนอราคา");

    const { generateQuotationPdf } = await import(
      "@/lib/accounting/pdf/generate-quotation"
    );
    const pdfBuffer = await generateQuotationPdf(quotation.id);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quotation.quotationNumber}.pdf"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
