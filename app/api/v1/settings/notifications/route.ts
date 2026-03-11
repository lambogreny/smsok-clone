import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getNotificationPrefs, updateNotificationPrefs } from "@/lib/actions/settings";

// GET /api/v1/settings/notifications — get notification preferences
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const prefs = await getNotificationPrefs(user.id);
    return apiResponse(prefs);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/notifications — update notification preferences
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const result = await updateNotificationPrefs(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
