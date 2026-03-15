import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import { getSenderNames } from "@/lib/actions/sender-names";
import { getContacts } from "@/lib/actions/contacts";
import { getRemainingQuota } from "@/lib/package/quota";
import dynamic from "next/dynamic";
import { ErrorState } from "@/components/ErrorState";

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let stats: Awaited<ReturnType<typeof getDashboardStats>> | null = null;
  let quota: Awaited<ReturnType<typeof getRemainingQuota>> | null = null;
  let senderNames: Awaited<ReturnType<typeof getSenderNames>> = [];
  let contactsResult: Awaited<ReturnType<typeof getContacts>> | null = null;

  try {
    [stats, quota, senderNames, contactsResult] = await Promise.all([
      getDashboardStats().catch(() => null),
      getRemainingQuota(user.id).catch(() => ({
        packages: [] as Awaited<ReturnType<typeof getRemainingQuota>>["packages"],
        totalSms: 0,
        totalUsed: 0,
        totalRemaining: 0,
        senderNameLimit: null as number | null,
      })),
      getSenderNames().catch(() => [] as Awaited<ReturnType<typeof getSenderNames>>),
      getContacts().catch(() => null),
    ]);
  } catch {}

  const defaultStats = {
    user: { name: user.name ?? "ผู้ใช้ใหม่", email: user.email ?? "" },
    today: { total: 0, delivered: 0, failed: 0, sent: 0, pending: 0 },
    yesterday: { total: 0, delivered: 0, failed: 0, sent: 0, pending: 0 },
    thisMonth: { total: 0, delivered: 0, failed: 0, sent: 0, pending: 0 },
    recentMessages: [] as { id: string; recipient: string; status: string; senderName: string; creditCost: number; createdAt: Date }[],
    last7Days: [] as { day: string; short: string; date: string; sms: number; delivered: number; failed: number }[],
  };
  const defaultQuota = { packages: [] as { id: string; smsTotal: number; smsUsed: number; expiresAt: Date; tier: { name: string; tierCode: string } }[], totalSms: 0, totalUsed: 0, totalRemaining: 0 };

  if (!stats) stats = defaultStats as Awaited<ReturnType<typeof getDashboardStats>>;
  if (!quota) quota = defaultQuota as Awaited<ReturnType<typeof getRemainingQuota>>;

  // Compute onboarding completed steps
  const completedSteps: string[] = [];

  if (Array.isArray(senderNames) && senderNames.length > 0) {
    completedSteps.push("sender");
  }

  const contactList = Array.isArray(contactsResult)
    ? contactsResult
    : (contactsResult as { contacts?: unknown[] } | null)?.contacts;
  if (Array.isArray(contactList) && contactList.length > 0) {
    completedSteps.push("contacts");
  }

  if (stats.today.total > 0 || stats.thisMonth.total > 0) {
    completedSteps.push("test-sms");
  }

  const showOnboarding = completedSteps.length < 4;

  const statsWithQuota = {
    ...stats,
    recentMessages: stats.recentMessages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
    smsRemaining: quota.totalRemaining,
  };

  // Serialize quota packages for client (Date → string)
  const quotaForClient = {
    packages: quota.packages.map((pkg) => ({
      id: pkg.id,
      smsTotal: pkg.smsTotal,
      smsUsed: pkg.smsUsed,
      expiresAt: pkg.expiresAt.toISOString(),
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
      onboardingSteps={completedSteps}
      showOnboarding={showOnboarding}
    />
  );
}
