import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import { getRemainingQuota } from "@/lib/package/quota";
import AnalyticsContent from "./AnalyticsContent";
import { ErrorState } from "@/components/ErrorState";

export default async function AnalyticsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let quota: { totalRemaining: number } | null = null;
  try {
    [stats, quota] = await Promise.all([
      getDashboardStats(),
      getRemainingQuota(user.id).catch(() => ({ totalRemaining: 0 })),
    ]);
  } catch {}

  if (!stats || !quota) {
    return <ErrorState type="SERVER_ERROR" />;
  }

  return (
    <AnalyticsContent
      stats={{
        ...stats,
        recentMessages: stats.recentMessages.map((message: (typeof stats.recentMessages)[number]) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        })),
        smsRemaining: quota.totalRemaining,
      }}
    />
  );
}
