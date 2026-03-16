import { redirect } from "next/navigation";

export default function SenderNamesRedirect() {
  redirect("/dashboard/senders");
}
