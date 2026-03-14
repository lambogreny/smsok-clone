import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError, authenticateRequest } from "@/lib/api-auth";
import { listRoles, createRole } from "@/lib/actions/rbac";
import { resolveOrganizationIdForUser } from "@/lib/organizations/resolve";
import { applyRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/organizations/:id/roles — list roles
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const roles = await listRoles(user.id, organizationId);
    return apiResponse({ roles });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/organizations/:id/roles — create custom role
export async function POST(req: NextRequest, { params }: Params) {
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
    const role = await createRole(user.id, organizationId, body);
    return apiResponse({ role }, 201);
  } catch (error) {
    return apiError(error);
  }
}
