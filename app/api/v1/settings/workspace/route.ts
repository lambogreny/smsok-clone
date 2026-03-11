import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getWorkspaceSettings, updateWorkspaceSettings } from "@/lib/actions/settings";

// GET /api/v1/settings/workspace — get workspace settings
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const settings = await getWorkspaceSettings(user.id);
    return apiResponse(settings);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/workspace — update workspace settings
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const result = await updateWorkspaceSettings(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
