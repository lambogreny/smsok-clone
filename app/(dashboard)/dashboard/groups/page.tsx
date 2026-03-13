import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroups } from "@/lib/actions/groups";
import GroupsPageClient from "./GroupsPageClient";

export default async function GroupsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const groups = await getGroups();

  return <GroupsPageClient initialGroups={groups} />;
}
