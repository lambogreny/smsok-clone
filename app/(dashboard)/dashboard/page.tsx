import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import { getRemainingQuota } from "@/lib/package/quota";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [stats, senderNames, quota] = await Promise.all([
    getDashboardStats(),
    getApprovedSenderNames(),
    getRemainingQuota(user.id).catch(() => ({
      packages: [],
      totalSms: 0,
      totalUsed: 0,
      totalRemaining: 0,
      senderNameLimit: null,
    })),
  ]);

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

  // TODO: Determine onboarding state from user profile
  // const showOnboarding = !user.onboardingCompletedAt;
  // const completedSteps = await getOnboardingSteps(user.id);

  return (
    <DashboardContent
      stats={statsWithQuota}
      quota={quotaForClient}
    />
  );
}
