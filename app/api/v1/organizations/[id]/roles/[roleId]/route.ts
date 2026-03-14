import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError, authenticateRequest } from "@/lib/api-auth";
import { getRole, updateRole, deleteRole } from "@/lib/actions/rbac";
import { resolveOrganizationIdForUser } from "@/lib/organizations/resolve";
type Params = { params: Promise<{ id: string; roleId: string }> };

// GET /api/v1/organizations/:id/roles/:roleId
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id, roleId } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const role = await getRole(user.id, organizationId, roleId);
    return apiResponse({ role });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/organizations/:id/roles/:roleId
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id, roleId } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const role = await updateRole(user.id, organizationId, roleId, body);
    return apiResponse({ role });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/organizations/:id/roles/:roleId
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id, roleId } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    await deleteRole(user.id, organizationId, roleId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
