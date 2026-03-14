import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getUserPermissions } from "@/lib/rbac";
import { resolveOrganizationIdForUser } from "@/lib/organizations/resolve";
type Params = { params: Promise<{ id: string }> };

// GET /api/v1/organizations/:id/me/permissions
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const permissions = await getUserPermissions(user.id, organizationId);

    return apiResponse({
      organizationId,
      permissions: Array.from(permissions),
    });
  } catch (error) {
    return apiError(error);
  }
}
