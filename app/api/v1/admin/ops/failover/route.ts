import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getFailoverConfigs, setFailoverConfig } from "@/lib/actions/admin-ops";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["OPERATIONS"]);
    const configs = await getFailoverConfigs();
    return apiResponse({ configs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["OPERATIONS"]);
    const body = await req.json();
    const config = await setFailoverConfig(body);
    return apiResponse(config, 201);
  } catch (error) {
    return apiError(error);
  }
}
