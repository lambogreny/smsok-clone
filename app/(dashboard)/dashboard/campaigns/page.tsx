import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CampaignsClient from "./CampaignsClient";

export default async function CampaignsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  return <CampaignsClient />;
}
