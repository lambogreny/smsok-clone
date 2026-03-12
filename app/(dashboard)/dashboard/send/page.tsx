import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import SendSmsForm from "./SendSmsForm";

export default async function SendPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const approved = await getApprovedSenderNames(user.id);
  const names = approved.map(s => s.name);
  // Always include "EasySlip" as default sender
  const senderNames = names.includes("EasySlip") ? names : ["EasySlip", ...names];

  return (
    <SendSmsForm userId={user.id} senderNames={senderNames} />
  );
}
