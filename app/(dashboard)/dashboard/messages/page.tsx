import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMessages } from "@/lib/actions/sms";
import MessagesClient from "./MessagesClient";
import { ErrorState } from "@/components/ErrorState";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  try {
    const params = await searchParams;
    const search = params.search?.trim() || undefined;
    const page = Number(params.page ?? "1") || 1;

    const { messages, pagination } = await getMessages({ page, limit: 20, search });
    const serializedMessages = messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    }));

    return (
      <MessagesClient messages={serializedMessages} pagination={pagination} initialSearch={search} />
    );
  } catch {
    return <ErrorState type="SERVER_ERROR" />;
  }
}
