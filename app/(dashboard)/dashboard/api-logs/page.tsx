import { redirect } from "next/navigation";

export default function ApiLogsRedirect() {
  redirect("/dashboard/logs");
}
