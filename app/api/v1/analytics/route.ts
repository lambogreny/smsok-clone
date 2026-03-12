import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getAnalytics } from "@/lib/actions/analytics";

// GET /api/v1/analytics?period=today|week|month|all
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    const stats = await getAnalytics(user.id, period);
    return apiResponse(stats);
  } catch (error) {
    return apiError(error);
  }
}
