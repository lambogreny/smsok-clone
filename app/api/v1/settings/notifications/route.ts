import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getNotificationPrefs, updateNotificationPrefs } from "@/lib/actions/settings";
import { applyRateLimit } from "@/lib/rate-limit";
import { updateNotificationPrefsSchema } from "@/lib/validations";

// GET /api/v1/settings/notifications — get notification preferences
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const prefs = await getNotificationPrefs(user.id);
    return apiResponse(prefs);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/notifications — update notification preferences
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const body = await req.json();
    const input = updateNotificationPrefsSchema.parse(body);
    const result = await updateNotificationPrefs(user.id, input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
