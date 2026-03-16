import { redirect } from "next/navigation";

export default function SendSmsRedirect() {
  redirect("/dashboard/send");
}
