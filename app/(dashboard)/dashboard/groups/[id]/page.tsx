import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getGroupContacts, getContactsNotInGroup } from "@/lib/actions/groups";
import { prisma } from "@/lib/db";
import GroupDetailClient from "./GroupDetailClient";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  const group = await prisma.contactGroup.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { members: true } } },
  });

  if (!group) notFound();

  const [members, availableContacts] = await Promise.all([
    getGroupContacts(id),
    getContactsNotInGroup(id),
  ]);

  const serializedMembers = (members as { id: string; groupId: string; contactId: string; contact: { id: string; name: string; phone: string; email: string | null } }[]).map((m) => ({
    id: m.id,
    contactId: m.contactId,
    name: m.contact.name,
    phone: m.contact.phone,
    email: m.contact.email,
  }));

  const serializedAvailable = (availableContacts as { id: string; name: string; phone: string; email: string | null; tags: string | null }[]).map((c) => ({
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
