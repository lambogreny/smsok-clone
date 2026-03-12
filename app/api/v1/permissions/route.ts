import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { listPermissions } from "@/lib/actions/rbac";

// GET /api/v1/permissions — list all available permissions (for UI matrix)
export async function GET(req: NextRequest) {
  try {
    await authenticatePublicApiKey(req);
    const permissions = await listPermissions();
    return apiResponse({ permissions });
  } catch (error) {
    return apiError(error);
  }
}
