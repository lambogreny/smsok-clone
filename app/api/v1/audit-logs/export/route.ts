import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { exportAuditLogs } from "@/lib/actions/audit";

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req);
    const body = await req.json();

    const format = body.format === "csv" ? "csv" : "json";
    const result = await exportAuditLogs(
      {
        organizationId: body.organizationId,
        userId: body.userId,
        action: body.action,
        resource: body.resource,
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        search: body.search,
      },
      format
    );

    if (format === "csv") {
      return new Response(result.data, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
      });
    }

    return apiResponse({
      data: JSON.parse(result.data),
      filename: result.filename,
    });
  } catch (error) {
    return apiError(error);
  }
}
