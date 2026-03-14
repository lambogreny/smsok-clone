import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError, authenticateRequest } from "@/lib/api-auth";
import { getOrganization, updateOrganization, deleteOrganization } from "@/lib/actions/organizations";
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
    const org = await getOrganization(user.id, organizationId);
    return apiResponse(org);
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
    const org = await updateOrganization(user.id, organizationId, body);
    return apiResponse(org);
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
    await deleteOrganization(user.id, organizationId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
