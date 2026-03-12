import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getCTOMetrics } from "@/lib/actions/admin-cto";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["DEV"]);
    const metrics = await getCTOMetrics();
    return apiResponse(metrics);
  } catch (error) {
    return apiError(error);
  }
}
