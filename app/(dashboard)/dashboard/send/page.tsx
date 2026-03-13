import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApprovedSenderNames } from "@/lib/actions/sender-names";
import SendSmsForm from "./SendSmsForm";
import { ErrorState } from "@/components/ErrorState";

export default async function SendPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let senderNames: string[] | null = null;
  try {
    const approved = await getApprovedSenderNames();
    senderNames = approved.map(s => s.name);
  } catch {}

  if (!senderNames) {
    return <ErrorState type="SERVER_ERROR" />;
  }

  return (
    <SendSmsForm senderNames={senderNames} />
  );
}
