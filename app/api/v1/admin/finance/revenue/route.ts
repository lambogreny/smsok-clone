import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getRevenueMetrics, getRecentTransactions } from "@/lib/actions/admin-finance";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["FINANCE"]);
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // "metrics" or "transactions"

    if (view === "transactions") {
      const page = parseInt(searchParams.get("page") || "1");
      const result = await getRecentTransactions(page);
      return apiResponse(result);
    }

    const metrics = await getRevenueMetrics();
    return apiResponse(metrics);
  } catch (error) {
    return apiError(error);
  }
}
