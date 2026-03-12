import { NextRequest } from "next/server";
import { prisma as db } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/payments/expire — expire pending payments after 24h
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expiredPayments = await db.payment.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: now },
    },
    select: {
      id: true,
    },
  });

  if (expiredPayments.length === 0) {
    return Response.json({ processed: 0, message: "No pending payments to expire" });
  }

  await db.$transaction([
    db.payment.updateMany({
      where: {
        id: { in: expiredPayments.map((payment) => payment.id) },
      },
      data: {
        status: "EXPIRED",
      },
    }),
    db.paymentHistory.createMany({
      data: expiredPayments.map((payment) => ({
        paymentId: payment.id,
        fromStatus: "PENDING",
        toStatus: "EXPIRED",
        changedBy: "system",
        note: "Payment expired after 24 hours",
      })),
    }),
  ]);

  return Response.json({
    processed: expiredPayments.length,
    ids: expiredPayments.map((payment) => payment.id),
  });
}
