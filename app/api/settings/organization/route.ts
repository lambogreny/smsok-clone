import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { applyRateLimit } from "@/lib/rate-limit";
import { getOrganization, updateOrganization } from "@/lib/actions/organizations";
import { validateSendingHours } from "@/lib/sending-hours";

// GET /api/settings/organization — get user's org settings (session auth)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "api");
    if (rl.blocked) return rl.blocked;

    const membership = await db.membership.findFirst({
      where: { userId: session.id },
      select: { organizationId: true, role: true },
    });
    if (!membership) throw new ApiError(404, "ไม่พบองค์กร");

    const org = await getOrganization(session.id, membership.organizationId);
    return apiResponse(org);
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/settings/organization — update org settings (session auth, dashboard)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    const rl = await applyRateLimit(session.id, "api");
    if (rl.blocked) return rl.blocked;

    const membership = await db.membership.findFirst({
      where: { userId: session.id },
      select: { organizationId: true },
    });
    if (!membership) throw new ApiError(404, "ไม่พบองค์กร");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    // Extra validation for sending hours
    const b = body as Record<string, unknown>;
    if (b.sendingHoursStart !== undefined && b.sendingHoursEnd !== undefined) {
      const validation = validateSendingHours(
        Number(b.sendingHoursStart),
        Number(b.sendingHoursEnd)
      );
      if (!validation.valid) throw new ApiError(400, validation.error!);
    }

    const org = await updateOrganization(session.id, membership.organizationId, body);
    return apiResponse(org);
  } catch (error) {
    return apiError(error);
  }
}
