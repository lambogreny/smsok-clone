import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const refundSchema = z.object({
  amount: z.number().int().min(1, "จำนวนเงินคืนต้องมากกว่า 0").optional(), // satang, partial refund
  note: z.string().max(500).optional(),
});

// POST /api/admin/payments/:id/refund — initiate refund
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);

    const rl = await applyRateLimit(admin.id, "admin");
    if (rl.blocked) return rl.blocked;

    const { id } = await ctx.params;
    const body = await req.json();
    const { amount, note } = refundSchema.parse(body);

    const payment = await db.payment.findUnique({
      where: { id },
      select: { id: true, status: true, totalAmount: true, userId: true, packageTierId: true },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");
    if (payment.status !== "COMPLETED") {
      throw new ApiError(400, "สามารถคืนเงินได้เฉพาะรายการที่ชำระสำเร็จแล้ว");
    }

    const refundAmount = amount ?? payment.totalAmount ?? 0;
    if (refundAmount > (payment.totalAmount ?? 0)) {
      throw new ApiError(400, "จำนวนเงินคืนเกินยอดชำระ");
    }
    const isFullRefund = refundAmount === (payment.totalAmount ?? 0);

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: "REFUNDED",
          refundAmount,
          refundedAt: new Date(),
          adminNote: note ?? null,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
        select: { id: true, status: true, refundAmount: true, refundedAt: true },
      });

      await tx.paymentHistory.create({
        data: {
          paymentId: id,
          fromStatus: "COMPLETED",
          toStatus: "REFUNDED",
          changedBy: admin.id,
          note: note ?? `Refund ${refundAmount} satang by ${admin.name}`,
        },
      });

      // Deactivate related package purchases
      if (payment.packageTierId && isFullRefund) {
        await tx.packagePurchase.updateMany({
          where: {
            transactionId: payment.id,
            userId: payment.userId,
            tierId: payment.packageTierId,
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      return updated;
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
