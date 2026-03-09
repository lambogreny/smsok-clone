import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "../DashboardShell";
import SendSmsForm from "./SendSmsForm";

export default async function SendPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <DashboardShell user={user} title="Send SMS">
      <SendSmsForm userId={user.id} />
    </DashboardShell>
  );
}
