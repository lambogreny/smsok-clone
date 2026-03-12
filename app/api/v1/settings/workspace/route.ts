import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getWorkspaceSettings, updateWorkspaceSettings } from "@/lib/actions/settings";

// GET /api/v1/settings/workspace — get workspace settings
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const settings = await getWorkspaceSettings(user.id);
    return apiResponse(settings);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/workspace — update workspace settings
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const result = await updateWorkspaceSettings(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
