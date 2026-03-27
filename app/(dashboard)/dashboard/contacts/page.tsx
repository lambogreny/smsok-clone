import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getContacts, getContactGroups, getContactStats } from "@/lib/actions/contacts";
import { getTags } from "@/lib/actions/tags";
import ContactsClient from "./ContactsClient";
import { ErrorState } from "@/components/ErrorState";

const VALID_LIMITS = [20, 50, 100] as const;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; status?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { page: pageParam, limit: limitParam, status: statusParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);
  const limitParsed = parseInt(limitParam ?? "20") || 20;
  const limit = (VALID_LIMITS as readonly number[]).includes(limitParsed) ? limitParsed : 20;

  try {
    const [contactsResult, groups, stats, dbTags] = await Promise.all([
      getContacts({ page, limit }),
      getContactGroups(),
      getContactStats(),
      getTags(),
    ]);

    if (!contactsResult || !groups || !stats) {
      return <ErrorState type="SERVER_ERROR" />;
    }

    const { contacts, pagination } = contactsResult;

    // Serialize dates for client component (inside try/catch for safety)
    const serializedContacts = contacts.map((c: typeof contacts[number]) => ({
      id: c.id,
      name: c.name ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      tags: (c.contactTags ?? []).map((ct: { tag: { id: string; name: string; color?: string | null } }) => ({
        id: ct.tag.id,
        name: ct.tag.name,
        color: ct.tag.color ?? "",
      })),
      smsConsent: c.smsConsent ?? false,
      groups: (c.groups ?? []).map((g: typeof c.groups[number]) => ({
        id: g.group.id,
        name: g.group.name,
      })),
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    }));

    return (
      <ContactsClient
        initialContacts={serializedContacts}
        totalContacts={pagination.total}
        initialPage={page}
        initialLimit={limit}
        totalPages={pagination.totalPages}
        groups={groups}
        stats={stats}
        initialStatus={statusParam || "all"}
        availableTags={dbTags.map((t) => ({ name: t.name, color: t.color }))}
      />
    );
  } catch {
    return <ErrorState type="SERVER_ERROR" />;
  }
}
