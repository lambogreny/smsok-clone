import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import { getRemainingQuota } from "@/lib/package/quota";
import DashboardContent from "./DashboardContent";
import { ErrorState } from "@/components/ErrorState";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let quota: Awaited<ReturnType<typeof getRemainingQuota>> | null = null;
  try {
    [stats, quota] = await Promise.all([
      getDashboardStats(),
      getRemainingQuota(user.id).catch(() => ({
        packages: [] as Awaited<ReturnType<typeof getRemainingQuota>>["packages"],
        totalSms: 0,
        totalUsed: 0,
        totalRemaining: 0,
        senderNameLimit: null as number | null,
      })),
    ]);
  } catch {}

  if (!stats || !quota) {
    return <ErrorState type="SERVER_ERROR" />;
  }

  const statsWithQuota = { ...stats, smsRemaining: quota.totalRemaining };

  // Serialize quota packages for client (Date → string)
  const quotaForClient = {
    packages: quota.packages.map((pkg) => ({
      id: pkg.id,
      smsTotal: pkg.smsTotal,
      smsUsed: pkg.smsUsed,
      expiresAt: pkg.expiresAt,
      tier: { name: pkg.tier.name, tierCode: pkg.tier.tierCode },
    })),
    totalSms: quota.totalSms,
    totalUsed: quota.totalUsed,
    totalRemaining: quota.totalRemaining,
  };

  return (
    <DashboardContent
      stats={statsWithQuota}
      quota={quotaForClient}
    />
  );
}
