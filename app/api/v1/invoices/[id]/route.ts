import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/invoices/:id — get invoice detail
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { id } = await ctx.params;

    const invoice = await db.invoice.findFirst({
      where: { id, userId: session.id },
    });
    if (!invoice) throw new ApiError(404, "ไม่พบใบแจ้งหนี้");

    return apiResponse(invoice);
  } catch (error) {
    return apiError(error);
  }
}
