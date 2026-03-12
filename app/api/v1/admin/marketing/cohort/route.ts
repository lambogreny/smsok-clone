import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getCohortData } from "@/lib/actions/admin-marketing";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["MARKETING"]);
    const months = Number(req.nextUrl.searchParams.get("months")) || 6;
    const data = await getCohortData(months);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
