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
    getDashboardStats(user.id),
    getApprovedSenderNames(user.id),
    getRemainingQuota(user.id).catch(() => ({ totalRemaining: 0 })),
  ]);

  const names = senderNames.map(s => s.name);
  const statsWithQuota = { ...stats, smsRemaining: quota.totalRemaining };
  return <DashboardContent user={user} stats={statsWithQuota} senderNames={names.length > 0 ? names : ["EasySlip"]} />;
}
