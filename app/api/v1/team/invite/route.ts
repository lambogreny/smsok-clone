import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { createInvite, getOrgInvites } from "@/lib/actions/organizations";
import { prisma as db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return apiError(new Error("Unauthorized"));

    // Get user's organization
    const membership = await db.membership.findFirst({
      where: { userId: session.id },
      select: { organizationId: true },
    });
    if (!membership) return apiError(new Error("ไม่พบ organization"));

    const invites = await getOrgInvites(session.id, membership.organizationId);
    return apiResponse({ invites });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return apiError(new Error("Unauthorized"));

    // Get user's organization
    const membership = await db.membership.findFirst({
      where: { userId: session.id },
      select: { organizationId: true },
    });
    if (!membership) return apiError(new Error("ไม่พบ organization"));

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const invite = await createInvite(session.id, membership.organizationId, body);
    return apiResponse(invite, 201);
  } catch (error) {
    return apiError(error);
  }
}
