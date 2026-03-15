import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRemainingQuota } from "@/lib/package/quota";
import DashboardShell from "./DashboardShell";
import AuthGuard from "@/components/AuthGuard";

// Pages accessible without login (pricing, etc.)
const PUBLIC_DASHBOARD_PATHS = ["/dashboard/packages", "/dashboard/billing/packages"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  const user = await getSession();
  const isPublicPage = PUBLIC_DASHBOARD_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPage) redirect("/login");

  let smsRemaining = 0;
  if (user) {
    try {
      const quota = await getRemainingQuota(user.id);
      smsRemaining = quota.totalRemaining;
    } catch {
      smsRemaining = 0;
    }
  }

  return (
    <DashboardShell user={user} smsRemaining={smsRemaining}>
      {user && <AuthGuard />}
      {children}
    </DashboardShell>
  );
}
