import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getUserGrowth } from "@/lib/actions/admin-ceo";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, []);
    const months = Number(req.nextUrl.searchParams.get("months")) || 12;
    const data = await getUserGrowth(months);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
