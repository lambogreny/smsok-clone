import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getGroupContacts, getContactsNotInGroup } from "@/lib/actions/groups";
import { prisma } from "@/lib/db";
import GroupDetailClient from "./GroupDetailClient";
import { ErrorState } from "@/components/ErrorState";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  let group: Awaited<ReturnType<typeof prisma.contactGroup.findFirst<{ where: { id: string; userId: string }; include: { _count: { select: { members: true } } } }>>> | null = null;
  let members: Awaited<ReturnType<typeof getGroupContacts>> | null = null;
  let availableContacts: Awaited<ReturnType<typeof getContactsNotInGroup>> | null = null;
  let loadError = false;
  try {
    group = await prisma.contactGroup.findFirst({
      where: { id, userId: user.id },
      include: { _count: { select: { members: true } } },
    });

    if (!group) notFound();

    [members, availableContacts] = await Promise.all([
      getGroupContacts(id),
      getContactsNotInGroup(id),
    ]);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    loadError = true;
  }

  if (loadError || !group || !members || !availableContacts) return <ErrorState type="SERVER_ERROR" />;

  const serializedMembers = members.map((m: Record<string, unknown> & { id: string; contactId: string; contact?: { name: string; phone: string; email: string | null } }) => ({
    id: m.id,
    contactId: m.contactId,
    name: m.contact?.name ?? "",
    phone: m.contact?.phone ?? "",
    email: m.contact?.email ?? "",
  }));

  const serializedAvailable = availableContacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    tags: c.tags,
  }));

  return (
    <GroupDetailClient
      groupId={id}
      groupName={group.name}
      memberCount={group._count.members}
      createdAt={group.createdAt.toISOString()}
      initialMembers={serializedMembers}
      availableContacts={serializedAvailable}
    />
  );
}
