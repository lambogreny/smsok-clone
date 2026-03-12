import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getOpsMetrics } from "@/lib/actions/admin-ops";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["OPERATIONS", "DEV"]);
    const metrics = await getOpsMetrics();
    return apiResponse(metrics);
  } catch (error) {
    return apiError(error);
  }
}
