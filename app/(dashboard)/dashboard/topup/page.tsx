import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPackages } from "@/lib/actions/payments";
import TopupContent from "./TopupContent";

export default async function TopupPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let packages = [];
  try {
    packages = await getPackages();
  } catch {
    packages = [];
  }

  return (
    <TopupContent user={user} packages={packages} />
  );
}
