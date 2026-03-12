import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { toggleMaintenance } from "@/lib/actions/admin-cto";

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["DEV"]);
    const body = await req.json();
    const result = await toggleMaintenance(admin.id, body.enable);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
