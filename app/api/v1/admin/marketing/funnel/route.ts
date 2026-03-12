import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getFunnelData } from "@/lib/actions/admin-marketing";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["MARKETING"]);
    const data = await getFunnelData();
    return apiResponse(data);
  } catch (error) {
    return apiError(error);
  }
}
