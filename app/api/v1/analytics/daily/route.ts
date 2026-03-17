import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiResponse } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

type DailyRow = {
  day: Date;
  sent: bigint;
  delivered: bigint;
  failed: bigint;
};

function toCount(value: bigint | number | null | undefined) {
  return Number(value ?? 0);
}

function buildDateSeries(days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (days - index - 1));
    return day;
  });
}

// GET /api/v1/analytics/daily?days=1|7|30
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const days = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get("days") || "30")));
    const dateSeries = buildDateSeries(days);
    const from = dateSeries[0];

    const rows = await db.$queryRaw<DailyRow[]>`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) FILTER (WHERE status = 'sent')::bigint AS sent,
        COUNT(*) FILTER (WHERE status = 'delivered')::bigint AS delivered,
        COUNT(*) FILTER (WHERE status = 'failed')::bigint AS failed
      FROM messages
      WHERE user_id = ${user.id} AND created_at >= ${from}
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `;

    const rowMap = new Map(
      rows.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        {
          sent: toCount(row.sent),
          delivered: toCount(row.delivered),
          failed: toCount(row.failed),
        },
      ]),
    );

    return apiResponse({
      data: dateSeries.map((day) => {
        const key = day.toISOString().slice(0, 10);
        const stats = rowMap.get(key);
        return {
          date: key,
          sent: stats?.sent ?? 0,
          delivered: stats?.delivered ?? 0,
          failed: stats?.failed ?? 0,
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
