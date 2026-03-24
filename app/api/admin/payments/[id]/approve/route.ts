import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const approveSchema = z.object({
  note: z.string().max(500).optional(),
});

// POST /api/admin/payments/:id/approve — approve payment + activate package
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const admin = await authenticateAdmin(req, ["SUPER_ADMIN", "FINANCE"]);
    const { id } = await ctx.params;
    const body = await req.json();
    const { note } = approveSchema.parse(body);

    const payment = await db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        userId: true,
        organizationId: true,
        packageTierId: true,
        totalAmount: true,
      },
    });

    if (!payment) throw new ApiError(404, "ไม่พบรายการชำระเงิน");

    const allowedStatuses = ["PENDING", "PENDING_REVIEW", "PROCESSING"];
    if (!allowedStatuses.includes(payment.status)) {
      throw new ApiError(400, `ไม่สามารถอนุมัติจากสถานะ ${payment.status}`);
    }

    // Transaction: update payment + create history + activate package
    const result = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
          adminNote: note ?? null,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        },
        select: { id: true, status: true, paidAt: true },
      });

      await tx.paymentHistory.create({
        data: {
          paymentId: id,
          fromStatus: payment.status,
          toStatus: "COMPLETED",
          changedBy: admin.id,
          note: note ?? `Approved by ${admin.name}`,
        },
      });

      // Activate package if linked to a tier
      if (payment.packageTierId) {
        const tier = await tx.packageTier.findUnique({
          where: { id: payment.packageTierId },
          select: { totalSms: true, expiryMonths: true },
        });
        if (tier) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + tier.expiryMonths);
          await tx.packagePurchase.create({
            data: {
              userId: payment.userId,
              organizationId: payment.organizationId,
              tierId: payment.packageTierId,
              smsTotal: tier.totalSms,
              expiresAt,
              isActive: true,
              transactionId: payment.id,
            },
          });
        }
      }

      return updated;
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
