import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getInactiveUsers } from "@/lib/actions/admin-marketing";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["MARKETING"]);
    const days = Number(req.nextUrl.searchParams.get("days")) || 30;
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 50;
    const data = await getInactiveUsers(days, limit);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
