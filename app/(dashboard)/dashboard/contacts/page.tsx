import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getContacts, getContactGroups } from "@/lib/actions/contacts";
import ContactsClient from "./ContactsClient";

export default async function ContactsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [{ contacts, pagination }, groups] = await Promise.all([
    getContacts(user.id),
    getContactGroups(user.id),
  ]);

  // Serialize dates for client component
  const serializedContacts = contacts.map((c: typeof contacts[number]) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    tags: c.tags,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <ContactsClient
      userId={user.id}
      initialContacts={serializedContacts}
      totalContacts={pagination.total}
      initialGroups={groups}
    />
  );
}
