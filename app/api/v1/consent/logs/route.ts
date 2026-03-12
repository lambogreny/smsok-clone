import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getConsentLogs } from "@/lib/actions/consent";
import type { ConsentType, ConsentAction } from "@prisma/client";

// GET /api/v1/consent/logs — admin: list consent logs
export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req);

    const params = req.nextUrl.searchParams;
    const result = await getConsentLogs({
      userId: params.get("userId") ?? undefined,
      consentType: (params.get("consentType") as ConsentType) ?? undefined,
      action: (params.get("action") as ConsentAction) ?? undefined,
      page: params.get("page") ? Number(params.get("page")) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
