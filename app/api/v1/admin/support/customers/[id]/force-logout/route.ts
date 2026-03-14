import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiResponse, ApiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { createAuditLog } from "@/lib/actions/audit";
import { prisma as db } from "@/lib/db";
import { revokeAllUserSessions } from "@/lib/auth";
import { getClientIp } from "@/lib/session-utils";

const bodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await authenticateAdmin(req, ["SUPPORT", "OPERATIONS"]);
    const { id } = await params;
    const rawBody = await req.json().catch(() => ({}));
    const body = bodySchema.parse(rawBody);

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        memberships: {
          select: { organizationId: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "ไม่พบผู้ใช้งาน");
    }

    const revoked = await revokeAllUserSessions(user.id, {
      incrementSecurityVersion: true,
    });

    await createAuditLog({
      organizationId: user.memberships[0]?.organizationId ?? null,
      userId: user.id,
      action: "admin.session.force_logout",
      resource: "UserSession",
      resourceId: user.id,
      metadata: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminRole: admin.role,
        targetEmail: user.email,
        revokedSessions: revoked,
        reason: body.reason ?? null,
      },
      ipAddress: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent") ?? undefined,
      result: "success",
    });

    return apiResponse({
      success: true,
      userId: user.id,
      email: user.email,
      revoked,
      securityVersionIncremented: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
