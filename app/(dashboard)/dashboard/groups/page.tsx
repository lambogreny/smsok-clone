import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroups } from "@/lib/actions/groups";
import { getContacts } from "@/lib/actions/contacts";
import GroupsPageClient from "./GroupsPageClient";

export default async function GroupsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [groups, { contacts }] = await Promise.all([
    getGroups(user.id),
    getContacts(user.id, { page: 1, limit: 1000 }),
  ]);

  const allContacts = contacts.map((c: { id: string; name: string; phone: string }) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
  }));

  return <GroupsPageClient userId={user.id} initialGroups={groups} allContacts={allContacts} />;
}
