import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApiKeys } from "@/lib/actions/api-keys";
import ApiKeysContent from "./ApiKeysContent";

export default async function ApiKeysPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let apiKeys: Awaited<ReturnType<typeof getApiKeys>> = [];
  try {
    apiKeys = await getApiKeys();
  } catch {
    apiKeys = [];
  }

  // Serialize dates to ISO strings for RSC → client boundary
  const serialized = apiKeys.map((k: (typeof apiKeys)[number]) => ({
    ...k,
    lastUsed: k.lastUsed ? new Date(k.lastUsed).toISOString() : null,
    revokedAt: k.revokedAt ? new Date(k.revokedAt).toISOString() : null,
    createdAt: new Date(k.createdAt).toISOString(),
  }));

  return (
    <ApiKeysContent apiKeys={serialized} />
  );
}
