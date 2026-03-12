import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { searchAuditLogs } from "@/lib/actions/audit";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const { searchParams } = new URL(req.url);

    const result = await searchAuditLogs({
      organizationId: searchParams.get("organizationId") || undefined,
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      resource: searchParams.get("resource") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
