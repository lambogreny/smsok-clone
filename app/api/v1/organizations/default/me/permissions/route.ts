import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getUserPermissions } from "@/lib/rbac";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";

// GET /api/v1/organizations/default/me/permissions
// Returns the current user's permissions in their default (first) organization
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;

    // Find user's first organization membership
    const membership = await db.membership.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
      orderBy: { createdAt: "asc" },
    });

    if (!membership) {
      return apiResponse({ permissions: [] });
    }

    const perms = await getUserPermissions(user.id, membership.organizationId);

    return apiResponse({
      organizationId: membership.organizationId,
      permissions: Array.from(perms),
    });
  } catch (error) {
    return apiError(error);
  }
}
