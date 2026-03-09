import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getContacts } from "@/lib/actions/contacts";
import DashboardShell from "../DashboardShell";
import ContactsClient from "./ContactsClient";

export default async function ContactsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { contacts, pagination } = await getContacts(user.id);

  // Serialize dates for client component
  const serializedContacts = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    tags: c.tags,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <DashboardShell user={user} title="Contacts">
      <ContactsClient
        userId={user.id}
        initialContacts={serializedContacts}
        totalContacts={pagination.total}
      />
    </DashboardShell>
  );
}
