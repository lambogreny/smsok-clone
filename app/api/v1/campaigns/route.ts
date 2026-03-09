import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { createCampaign, getCampaigns } from "@/lib/actions/campaigns";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createCampaignSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";

    const result = await getCampaigns(user.id, { page, limit });
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const limit = checkRateLimit(user.id, "batch");
    if (!limit.allowed) return rateLimitResponse(limit.resetIn);

    const body = await req.json();
    const input = createCampaignSchema.parse(body);
    const campaign = await createCampaign(user.id, input);
    return apiResponse(campaign, 201);
  } catch (error) {
    return apiError(error);
  }
}
