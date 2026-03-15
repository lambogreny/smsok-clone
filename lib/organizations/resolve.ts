import { ApiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

export const DEFAULT_ORGANIZATION_ID = "default";

export async function resolveOrganizationIdForUser(
  userId: string,
  requestedOrganizationId: string,
) {
  if (requestedOrganizationId !== DEFAULT_ORGANIZATION_ID) {
    return requestedOrganizationId;
  }

  const membership = await db.membership.findFirst({
    where: { userId },
    select: { organizationId: true },
    orderBy: { createdAt: "desc" },
  });

  if (!membership) {
    throw new ApiError(404, "ไม่พบองค์กรเริ่มต้น");
  }

  return membership.organizationId;
}
