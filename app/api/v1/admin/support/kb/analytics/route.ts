import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getKBAnalytics } from "@/lib/actions/admin-support";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const analytics = await getKBAnalytics();
    return apiResponse({ analytics });
  } catch (error) {
    return apiError(error);
  }
}
