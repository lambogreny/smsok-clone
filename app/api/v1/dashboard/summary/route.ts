import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/actions/sms";
import { prisma as db } from "@/lib/db";
import { getRemainingQuota } from "@/lib/package/quota";

// GET /api/v1/dashboard/summary — dashboard summary cards (sent, credits, contacts)
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    }

    const [stats, quota, contactsTotal] = await Promise.all([
      getDashboardStats(session.id),
      getRemainingQuota(session.id),
      db.contact.count({ where: { userId: session.id } }),
    ]);

    return apiResponse({
      summary: {
        sentToday: stats.today.total,
        sentThisMonth: stats.thisMonth.total,
        creditsRemaining: quota.totalRemaining,
        contactsTotal,
      },
      sent: {
        today: stats.today,
        yesterday: stats.yesterday,
        thisMonth: stats.thisMonth,
      },
      credits: {
        total: quota.totalSms,
        used: quota.totalUsed,
        remaining: quota.totalRemaining,
        packages: quota.packages.map((pkg) => ({
          id: pkg.id,
          tierCode: pkg.tier.tierCode,
          name: pkg.tier.name,
          smsTotal: pkg.smsTotal,
          smsUsed: pkg.smsUsed,
          expiresAt: pkg.expiresAt.toISOString(),
        })),
      },
      contacts: {
        total: contactsTotal,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
