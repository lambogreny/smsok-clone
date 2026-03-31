import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRemainingQuota } from "@/lib/package/quota";
import SettingsContent from "./SettingsContent";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ forceChange?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const { forceChange } = await searchParams;

  type AvatarRow = { avatar_url: string | null };
  const [fullUser, avatarRows, quota] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.$queryRaw<AvatarRow[]>`SELECT avatar_url FROM users WHERE id = ${user.id} LIMIT 1`,
    getRemainingQuota(user.id).catch(() => ({ totalRemaining: 0 })),
  ]);

  if (!fullUser) redirect("/login");

  const serializedUser = {
    ...fullUser,
    createdAt: fullUser.createdAt.toISOString(),
    avatarUrl: avatarRows[0]?.avatar_url ?? null,
  };

  return (
    <SettingsContent
      user={serializedUser}
      smsRemaining={quota.totalRemaining}
      forceChange={forceChange === "true"}
    />
  );
}
