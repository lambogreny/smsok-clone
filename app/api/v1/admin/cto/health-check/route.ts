import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getSystemHealth } from "@/lib/actions/admin-cto";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["DEV"]);
    const health = await getSystemHealth();
    return apiResponse(health);
  } catch (error) {
    return apiError(error);
  }
}
