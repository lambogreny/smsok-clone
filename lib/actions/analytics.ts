
import { prisma as db } from "../db";
import { getRemainingQuota } from "../package/quota";

function getDateRange(period: string): { from: Date; label: string } {
  const now = new Date();
  switch (period) {
    case "today":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        label: "today",
      };
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d, label: "last_7_days" };
    }
    case "all":
      return { from: new Date(0), label: "all_time" };
    case "month":
    default: {
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        label: "this_month",
      };
    }
  }
}

export async function getAnalytics(userId: string, period: string) {
  const { from, label } = getDateRange(period);
  const now = new Date();

  const [
    statusCounts,
    creditUsed,
    dailyBreakdown,
    totalAllTime,
  ] = await db.$transaction([
    // Status breakdown
    db.message.groupBy({
      by: ["status"],
      where: { userId, createdAt: { gte: from } },
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),

    // Total credits used
    db.message.aggregate({
      where: { userId, createdAt: { gte: from } },
      _sum: { creditCost: true },
    }),

    // Daily breakdown (raw SQL for date grouping)
    db.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT DATE(created_at) as day, COUNT(*)::bigint as count
      FROM messages
      WHERE user_id = ${userId} AND created_at >= ${from}
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 30
    `,

    // All-time total
    db.message.count({ where: { userId } }),
  ]);

  type StatusRow = { status: string; _count: { _all: number } };
  const rows = statusCounts as unknown as StatusRow[];
  const total = rows.reduce((s, r) => s + r._count._all, 0);
  const sent = rows.find((r) => r.status === "sent")?._count._all ?? 0;
  const delivered = rows.find((r) => r.status === "delivered")?._count._all ?? 0;
  const failed = rows.find((r) => r.status === "failed")?._count._all ?? 0;
  const pending = rows.find((r) => r.status === "pending")?._count._all ?? 0;

  const successRate = total > 0
    ? Math.round(((sent + delivered) / total) * 10000) / 100
    : 0;

  const quota = await getRemainingQuota(userId);

  return {
    period: label,
    from: from.toISOString(),
    to: now.toISOString(),
    summary: {
      total,
      sent,
      delivered,
      failed,
      pending,
      successRate,
      creditsUsed: creditUsed._sum.creditCost ?? 0,
      creditsRemaining: quota.totalRemaining,
    },
    daily: dailyBreakdown.map((d: { day: string; count: bigint }) => ({
      date: String(d.day).slice(0, 10),
      count: Number(d.count),
    })),
    allTime: {
      totalMessages: totalAllTime,
    },
  };
}
