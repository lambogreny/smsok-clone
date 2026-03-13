import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTemplates } from "@/lib/actions/templates";
import TemplatesClient from "./TemplatesClient";

export default async function TemplatesPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const templates = await getTemplates();

  // Serialize dates for client component
  const serializedTemplates = templates.map((t) => ({
    id: t.id,
    userId: t.userId,
    name: t.name,
    content: t.content,
    category: t.category,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <TemplatesClient initialTemplates={serializedTemplates} />
  );
}
