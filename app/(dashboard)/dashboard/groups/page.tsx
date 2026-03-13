import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroups } from "@/lib/actions/groups";
import GroupsPageClient from "./GroupsPageClient";
import { ErrorState } from "@/components/ErrorState";

export default async function GroupsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let groups: Awaited<ReturnType<typeof getGroups>> | null = null;
  try {
    groups = await getGroups();
  } catch {}

  if (!groups) {
    return <ErrorState type="SERVER_ERROR" />;
  }

  return <GroupsPageClient initialGroups={groups} />;
}
