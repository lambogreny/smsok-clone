import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError, authenticateRequest } from "@/lib/api-auth";
import { getRolePermissions, setRolePermissions } from "@/lib/actions/rbac";
import { resolveOrganizationIdForUser } from "@/lib/organizations/resolve";
import { applyRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string; roleId: string }> };

// GET /api/v1/organizations/:id/roles/:roleId/permissions
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const { id, roleId } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const result = await getRolePermissions(user.id, organizationId, roleId);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/organizations/:id/roles/:roleId/permissions — replace all permissions
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const { id, roleId } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const result = await setRolePermissions(user.id, organizationId, roleId, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
