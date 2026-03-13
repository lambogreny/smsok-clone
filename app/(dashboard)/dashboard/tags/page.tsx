import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTags } from "@/lib/actions/tags";
import TagsPageClient from "./TagsPageClient";
import { ErrorState } from "@/components/ErrorState";
import type { TagItem } from "@/lib/types/api-responses";

export default async function TagsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  try {
    const tags = await getTags();
    return <TagsPageClient initialTags={tags as TagItem[]} />;
  } catch {
    return <ErrorState type="SERVER_ERROR" />;
  }
}
