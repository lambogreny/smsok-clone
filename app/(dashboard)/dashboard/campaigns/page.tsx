import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCampaigns } from "@/lib/actions/campaigns";
import { prisma } from "@/lib/db";
import CampaignsClient from "./CampaignsClient";

export default async function CampaignsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { campaigns } = await getCampaigns(user.id);

  const [groups, templates, approvedSenders] = await prisma.$transaction([
    prisma.contactGroup.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.messageTemplate.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, content: true },
      orderBy: { name: "asc" },
    }),
    prisma.senderName.findMany({
      where: { userId: user.id, status: "APPROVED" },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const senderNames = ["EasySlip", ...approvedSenders.map((s) => s.name).filter((n) => n !== "EasySlip")];

  const serializedCampaigns = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status as "draft" | "scheduled" | "sending" | "running" | "completed" | "failed" | "cancelled",
    groupName: c.contactGroup?.name ?? "—",
    templateName: c.template?.name ?? "—",
    senderName: c.senderName ?? "EasySlip",
    scheduledAt: c.scheduledAt?.toISOString() ?? null,
    totalRecipients: c.totalRecipients,
    sentCount: c.sentCount,
    deliveredCount: c.deliveredCount,
    failedCount: c.failedCount,
    creditReserved: c.creditReserved,
    creditUsed: c.creditUsed,
    createdAt: c.createdAt.toISOString(),
  }));

  const serializedGroups = groups.map((g) => ({
    id: g.id,
    name: g.name,
    count: g._count.members,
  }));

  const serializedTemplates = templates.map((t) => ({
    id: t.id,
    name: t.name,
    body: t.content,
  }));

  return (
    <CampaignsClient
      userId={user.id}
      initialCampaigns={serializedCampaigns}
      groups={serializedGroups}
      templates={serializedTemplates}
      senderNames={senderNames}
    />
  );
}
