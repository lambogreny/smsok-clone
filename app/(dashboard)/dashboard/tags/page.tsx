import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTags } from "@/lib/actions/tags";
import TagsPageClient from "./TagsPageClient";

export default async function TagsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const tags = await getTags();

  return <TagsPageClient initialTags={tags} />;
}
