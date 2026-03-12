import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getActiveApiKeys } from "@/lib/actions/admin-cto";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["DEV"]);
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;
    const keys = await getActiveApiKeys(page, limit);
    return apiResponse(keys);
  } catch (error) {
    return apiError(error);
  }
}
