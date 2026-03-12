import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getPowerUsers } from "@/lib/actions/admin-marketing";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["MARKETING"]);
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;
    const data = await getPowerUsers(limit);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
