import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/v1/credits/usage?period=7d|30d — daily credit usage for chart
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const period = req.nextUrl.searchParams.get("period") === "30d" ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - period);
    since.setHours(0, 0, 0, 0);

    const orgFilter = session.organizationId
      ? { organizationId: session.organizationId }
      : { userId: session.id };

    const messages = await prisma.message.findMany({
      where: {
        ...orgFilter,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        creditCost: true,
      },
    });

    // Group by date
    const byDate = new Map<string, number>();
    for (let i = 0; i < period; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (period - 1 - i));
      byDate.set(d.toISOString().slice(0, 10), 0);
    }

    for (const msg of messages) {
      const key = msg.createdAt.toISOString().slice(0, 10);
      byDate.set(key, (byDate.get(key) ?? 0) + msg.creditCost);
    }

    const usage = Array.from(byDate.entries()).map(([date, creditsUsed]) => ({
      date,
      creditsUsed,
    }));

    return apiResponse({ usage });
  } catch (error) {
    return apiError(error);
  }
}
