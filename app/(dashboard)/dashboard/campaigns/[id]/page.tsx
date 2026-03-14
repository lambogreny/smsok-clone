import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CampaignDetailClient from "./CampaignDetailClient";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { id } = await params;

  return <CampaignDetailClient campaignId={id} />;
}
