import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getRevenueByPlan } from "@/lib/actions/admin-ceo";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, []);
    const data = await getRevenueByPlan();
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
