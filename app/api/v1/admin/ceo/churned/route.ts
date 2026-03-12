import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getChurnedUsers } from "@/lib/actions/admin-ceo";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, []);
    const limit = Number(req.nextUrl.searchParams.get("limit")) || 20;
    const data = await getChurnedUsers(limit);
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
