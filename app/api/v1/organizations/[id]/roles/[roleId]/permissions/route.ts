import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { getRolePermissions, setRolePermissions } from "@/lib/actions/rbac";

type Params = { params: Promise<{ id: string; roleId: string }> };

// GET /api/v1/organizations/:id/roles/:roleId/permissions
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id, roleId } = await params;
    const result = await getRolePermissions(user.id, id, roleId);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/organizations/:id/roles/:roleId/permissions — replace all permissions
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id, roleId } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const result = await setRolePermissions(user.id, id, roleId, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
