import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getFailedMessages } from "@/lib/actions/admin-ops";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["OPERATIONS", "SUPPORT"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const result = await getFailedMessages(page, limit);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
