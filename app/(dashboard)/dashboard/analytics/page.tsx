import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import { getRemainingQuota } from "@/lib/package/quota";
import AnalyticsContent from "./AnalyticsContent";

export default async function AnalyticsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [stats, quota] = await Promise.all([
    getDashboardStats(),
    getRemainingQuota(user.id).catch(() => ({ totalRemaining: 0 })),
  ]);

  return <AnalyticsContent stats={{ ...stats, smsRemaining: quota.totalRemaining }} />;
}
