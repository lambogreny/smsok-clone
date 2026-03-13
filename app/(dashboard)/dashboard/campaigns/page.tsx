import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loadCampaignsPageData } from "@/lib/campaigns/page-data";
import CampaignsClient from "./CampaignsClient";

export default async function CampaignsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let data: Awaited<ReturnType<typeof loadCampaignsPageData>> | null = null;
  let loadError = false;
  try {
    data = await loadCampaignsPageData(user.id);
  } catch {
    loadError = true;
  }

  return (
    <CampaignsClient
      userId={user.id}
      initialCampaigns={data?.campaigns ?? []}
      groups={data?.groups ?? []}
      templates={data?.templates ?? []}
      senderNames={data?.senderNames ?? ["EasySlip"]}
      loadError={loadError || !data}
    />
  );
}
