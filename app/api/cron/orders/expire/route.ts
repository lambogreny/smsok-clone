import { NextRequest } from "next/server";
import { apiSensitiveError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;
const ORDER_AUTO_CANCEL_AGE_DAYS = 7;

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - ORDER_AUTO_CANCEL_AGE_DAYS * 24 * 60 * 60 * 1000);
    const staleOrders = await db.order.findMany({
      where: {
        status: "PENDING_PAYMENT",
        createdAt: { lte: cutoff },
      },
      select: {
        id: true,
        status: true,
        rejectReason: true,
      },
    });

    if (staleOrders.length === 0) {
      return Response.json({
        processed: 0,
        message: "No stale pending orders to cancel",
      });
    }

    const cancelledAt = new Date();
    const cancelledIds = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const processed: string[] = [];

      for (const order of staleOrders) {
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: "PENDING_PAYMENT",
          },
          data: {
            status: "CANCELLED",
            cancelledAt,
            cancellationReason: "Order auto-cancelled after 7 days without successful slip verification",
          },
        });

        if (updated.count !== 1) {
          continue;
        }

        await tx.orderHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: "CANCELLED",
            changedBy: "system",
            note: order.rejectReason
              ? "Rejected order auto-cancelled after 7 days"
              : "Pending payment order auto-cancelled after 7 days",
          },
        });

        processed.push(order.id);
      }

      return processed;
    });

    return Response.json({
      processed: cancelledIds.length,
      ids: cancelledIds,
    });
  } catch (error) {
    return apiSensitiveError(error);
  }
}
