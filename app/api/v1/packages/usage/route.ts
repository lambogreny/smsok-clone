import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { z } from "zod";

const usageSearchParams = z.object({
  range: z.enum(["day", "week", "month"]).default("month"),
});

// GET /api/v1/packages/usage?range=day|week|month — SMS usage stats per day
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "Unauthorized");

    const { searchParams } = new URL(req.url);
    const { range } = usageSearchParams.parse({
      range: searchParams.get("range") || undefined,
    });
    const days = range === "day" ? 1 : range === "week" ? 7 : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate server-side with raw SQL GROUP BY
    const rows = await db.$queryRaw<
      Array<{ day: string; status: string; count: bigint }>
    >`
      SELECT DATE(created_at) as day, status, COUNT(*) as count
      FROM messages
      WHERE user_id = ${session.id}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at), status
      ORDER BY day ASC
    `;

    // Build daily map with all dates in range
    const dailyMap = new Map<string, { sent: number; failed: number }>();
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dailyMap.set(d.toISOString().slice(0, 10), { sent: 0, failed: 0 });
    }

    // Fill from DB results
    for (const row of rows) {
      const key = String(row.day);
      const entry = dailyMap.get(key);
      if (entry) {
        const cnt = Number(row.count);
        if (row.status === "sent" || row.status === "delivered") {
          entry.sent += cnt;
        } else if (row.status === "failed") {
          entry.failed += cnt;
        }
      }
    }

    const data = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    const totalSent = data.reduce((s, d) => s + d.sent, 0);
    const totalFailed = data.reduce((s, d) => s + d.failed, 0);
    const activeDays = data.filter((d) => d.sent > 0 || d.failed > 0).length;

    return apiResponse({
      data,
      summary: {
        totalSent,
        totalFailed,
        avgPerDay: activeDays > 0 ? Math.round(totalSent / activeDays) : 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
