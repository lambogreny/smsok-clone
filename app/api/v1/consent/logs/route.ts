import { NextRequest } from "next/server";
import { apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getConsentLogs } from "@/lib/actions/consent";
import type { ConsentType, ConsentAction } from "@prisma/client";

// GET /api/v1/consent/logs — admin: list all logs, user: list own logs
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const consentType = (params.get("consentType") as ConsentType) ?? undefined;
    const action = (params.get("action") as ConsentAction) ?? undefined;
    const page = params.get("page") ? Number(params.get("page")) : undefined;
    const limit = params.get("limit") ? Number(params.get("limit")) : undefined;

    try {
      await authenticateAdmin(req);

      const result = await getConsentLogs({
        userId: params.get("userId") ?? undefined,
        consentType,
        action,
        page,
        limit,
      });

      return apiResponse(result);
    } catch {
      const user = await authenticateRequest(req);
      const result = await getConsentLogs({
        userId: user.id,
        consentType,
        action,
        page,
        limit,
      });

      return apiResponse(result);
    }
  } catch (error) {
    return apiError(error);
  }
}
