import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroups } from "@/lib/actions/groups";
import GroupsPageClient from "./GroupsPageClient";
import { ErrorState } from "@/components/ErrorState";

export default async function GroupsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  try {
    const groups = await getGroups();
    return <GroupsPageClient initialGroups={groups} />;
  } catch {
    return <ErrorState type="SERVER_ERROR" />;
  }
}
