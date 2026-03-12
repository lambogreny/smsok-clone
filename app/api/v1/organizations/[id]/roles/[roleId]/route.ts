import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { getRole, updateRole, deleteRole } from "@/lib/actions/rbac";

type Params = { params: Promise<{ id: string; roleId: string }> };

// GET /api/v1/organizations/:id/roles/:roleId
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id, roleId } = await params;
    const role = await getRole(user.id, id, roleId);
    return apiResponse({ role });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/organizations/:id/roles/:roleId
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
    const role = await updateRole(user.id, id, roleId, body);
    return apiResponse({ role });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/v1/organizations/:id/roles/:roleId
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id, roleId } = await params;
    await deleteRole(user.id, id, roleId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
