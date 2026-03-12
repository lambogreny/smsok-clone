import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getTopCustomers } from "@/lib/actions/admin-ceo";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, []);
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 10;
    const data = await getTopCustomers(limit);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
