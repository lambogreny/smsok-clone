import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRemainingQuota } from "@/lib/package/quota";
import TopupContent from "./TopupContent";

export default async function TopupPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let smsRemaining = 0;
  try {
    const quota = await getRemainingQuota(user.id);
    smsRemaining = quota.totalRemaining;
  } catch {
    smsRemaining = 0;
  }

  return (
    <TopupContent user={user} packages={[]} smsRemaining={smsRemaining} />
  );
}
