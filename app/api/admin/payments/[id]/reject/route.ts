import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const rejectSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผล").max(500),
  note: z.string().max(500).optional(),
});

// POST /api/admin/payments/:id/reject — reject payment
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const { reason, note } = rejectSchema.parse(body);

    const payment = await db.payment.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");

    const allowedStatuses = ["PENDING", "PENDING_REVIEW", "PROCESSING"];
    if (!allowedStatuses.includes(payment.status)) {
      throw new ApiError(400, `ไม่สามารถปฏิเสธจากสถานะ ${payment.status}`);
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: "FAILED",
          rejectReason: reason,
          adminNote: note ?? null,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
        select: { id: true, status: true, rejectReason: true },
      });

      await tx.paymentHistory.create({
        data: {
          paymentId: id,
          fromStatus: payment.status,
          toStatus: "FAILED",
          changedBy: admin.id,
          note: `Rejected: ${reason}`,
        },
      });

      return updated;
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
