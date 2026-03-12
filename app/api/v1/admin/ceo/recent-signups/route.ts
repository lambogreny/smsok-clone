import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getRecentSignups } from "@/lib/actions/admin-ceo";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, []);
    const days = Number(req.nextUrl.searchParams.get("days")) || 7;
    const data = await getRecentSignups(days);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
