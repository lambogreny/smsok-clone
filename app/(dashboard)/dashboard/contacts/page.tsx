import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getContacts, getContactGroups } from "@/lib/actions/contacts";
import ContactsClient from "./ContactsClient";

const VALID_LIMITS = [20, 50, 100] as const;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { page: pageParam, limit: limitParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const limitParsed = parseInt(limitParam ?? "20") || 20;
  const limit = (VALID_LIMITS as readonly number[]).includes(limitParsed) ? limitParsed : 20;

  const [{ contacts, pagination }, groups] = await Promise.all([
    getContacts({ page, limit }),
    getContactGroups(),
  ]);

  // Serialize dates for client component
  const serializedContacts = contacts.map((c: typeof contacts[number]) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    tags: c.tags,
    smsConsent: c.smsConsent,
    groups: c.groups.map((g: typeof c.groups[number]) => ({
      id: g.group.id,
      name: g.group.name,
    })),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <ContactsClient
      initialContacts={serializedContacts}
      totalContacts={pagination.total}
      initialPage={page}
      initialLimit={limit}
      totalPages={pagination.totalPages}
      groups={groups}
    />
  );
}
