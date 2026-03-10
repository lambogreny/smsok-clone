import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getContacts } from "@/lib/actions/contacts";
import { getTags } from "@/lib/actions/tags";
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

  const [{ contacts, pagination }, tags] = await Promise.all([
    getContacts(user.id, { page, limit }),
    getTags(user.id),
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
      initialTags={tags}
      initialPage={page}
      initialLimit={limit}
      totalPages={pagination.totalPages}
    />
  );
}
