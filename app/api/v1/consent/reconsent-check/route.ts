import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { checkReconsentNeeded } from "@/lib/actions/consent";

// GET /api/v1/consent/reconsent-check — check if re-consent needed
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const needed = await checkReconsentNeeded(user.id);
    return apiResponse({ reconsentNeeded: needed });
  } catch (error) {
    return apiError(error);
  }
}
