import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { updateInvoiceStatusSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "VOIDED"],
  SENT: ["PAID", "OVERDUE", "VOIDED"],
  OVERDUE: ["PAID", "VOIDED"],
  PAID: [], // terminal
  VOIDED: [], // terminal
};

// PUT /api/v1/invoices/:id/status — update invoice status
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { id } = await ctx.params;
    const body = await req.json();
    const { status } = updateInvoiceStatusSchema.parse(body);

    const invoice = await db.invoice.findFirst({
      where: { id, userId: session.id },
      select: { id: true, status: true },
    });
    if (!invoice) throw new ApiError(404, "ไม่พบใบแจ้งหนี้");

    const allowed = VALID_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ApiError(
        400,
        `ไม่สามารถเปลี่ยนสถานะจาก ${invoice.status} เป็น ${status} ได้`,
      );
    }

    const data: Record<string, unknown> = { status };
    if (status === "PAID") data.paidAt = new Date();

    const updated = await db.invoice.update({
      where: { id },
      data,
    });

    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
