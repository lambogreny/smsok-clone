import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ErrorState } from "@/components/ErrorState";
import GroupDetailClient from "./GroupDetailClient";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  try {
    const group = await prisma.contactGroup.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                smsConsent: true,
                createdAt: true,
              },
            },
          },
          orderBy: { contact: { name: "asc" } },
        },
      },
    });

    if (!group) {
      return <ErrorState type="NOT_FOUND" />;
    }

    const serializedMembers = group.members.map((m: (typeof group.members)[number]) => ({
      id: m.contact.id,
      name: m.contact.name,
      phone: m.contact.phone,
      email: m.contact.email,
      smsConsent: m.contact.smsConsent,
      createdAt: m.contact.createdAt.toISOString(),
    }));

    return (
      <GroupDetailClient
        groupId={group.id}
        groupName={group.name}
        memberCount={group._count.members}
        createdAt={group.createdAt.toISOString()}
        members={serializedMembers}
      />
    );
  } catch {
    return <ErrorState type="SERVER_ERROR" />;
  }
}
