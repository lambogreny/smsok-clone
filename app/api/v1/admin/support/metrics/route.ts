import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getSupportMetrics } from "@/lib/actions/admin-support";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const metrics = await getSupportMetrics();
    return apiResponse({ metrics });
  } catch (error) {
    return apiError(error);
  }
}
