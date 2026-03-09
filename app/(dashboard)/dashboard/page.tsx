import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/lib/actions/sms";
import DashboardContent from "./DashboardContent";

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const stats = await getDashboardStats(user.id);

  return <DashboardContent user={user} stats={stats} />;
}
