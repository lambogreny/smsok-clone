import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getDeployments } from "@/lib/actions/admin-cto";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["DEV"]);
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const deployments = await getDeployments(page, limit);
    return apiResponse(deployments);
  } catch (error) {
    return apiError(error);
  }
}
