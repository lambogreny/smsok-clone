import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { listRoles, createRole } from "@/lib/actions/rbac";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/organizations/:id/roles — list roles
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const roles = await listRoles(user.id, id);
    return apiResponse({ roles });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/organizations/:id/roles — create custom role
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const role = await createRole(user.id, id, body);
    return apiResponse({ role }, 201);
  } catch (error) {
    return apiError(error);
  }
}
