import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { assignRole, unassignRole, getUserEffectivePermissions } from "@/lib/actions/rbac";

type Params = { params: Promise<{ id: string; memberId: string }> };

// GET /api/v1/organizations/:id/members/:memberId/roles — get effective permissions
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id, memberId } = await params;
    const result = await getUserEffectivePermissions(user.id, id, memberId);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/organizations/:id/members/:memberId/roles — assign role
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id, memberId } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const result = await assignRole(user.id, id, memberId, body);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/organizations/:id/members/:memberId/roles — unassign role
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id, memberId } = await params;
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("roleId");
    if (!roleId) throw new Error("กรุณาระบุ roleId");
    const result = await unassignRole(user.id, id, memberId, roleId);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
