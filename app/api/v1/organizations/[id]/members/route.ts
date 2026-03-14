import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError, authenticateRequest } from "@/lib/api-auth";
import { getOrgMembers, updateMemberRole, removeMember } from "@/lib/actions/organizations";
import { resolveOrganizationIdForUser } from "@/lib/organizations/resolve";
import { applyRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const members = await getOrgMembers(user.id, organizationId);
    return apiResponse({ members });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const { memberId, ...roleData } = body as Record<string, unknown>;
    if (!memberId || typeof memberId !== "string") throw new ApiError(400, "กรุณาระบุ memberId");
    const updated = await updateMemberRole(user.id, organizationId, memberId as string, roleData);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) throw new Error("กรุณาระบุ memberId");
    await removeMember(user.id, organizationId, memberId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
