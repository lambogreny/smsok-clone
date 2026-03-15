import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportPageClient from "./ImportPageClient";

export default async function ImportPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return <ImportPageClient />;
}
