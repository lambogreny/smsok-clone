import { NextRequest } from "next/server";
import { authenticateRequest, apiError, ApiError } from "@/lib/api-auth";
import { startApiLog, finishApiLog } from "@/lib/api-log";
import { prisma } from "@/lib/db";
import { toCsvCell } from "@/lib/csv";

const MAX_EXPORT_ROWS = 10000;

// GET /api/v1/logs/export?format=csv&from=2026-03-01&to=2026-03-10&status=400&endpoint=/sms/send
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const { searchParams } = new URL(req.url);

    const format = searchParams.get("format") || "csv";
    if (format !== "csv") {
      throw new ApiError(400, "Unsupported format. Use format=csv");
    }

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");
    const endpoint = searchParams.get("endpoint");
    const method = searchParams.get("method");

    const where: Record<string, unknown> = { userId: user.id };

    if (status) where.resStatus = parseInt(status, 10);
    if (endpoint) where.endpoint = { contains: endpoint };
    if (method) where.method = method.toUpperCase();
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
      };
    }

    const logs = await prisma.apiLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: MAX_EXPORT_ROWS,
      select: {
        id: true,
        method: true,
        endpoint: true,
        url: true,
        resStatus: true,
        latencyMs: true,
        ipAddress: true,
        source: true,
        errorCode: true,
        errorMsg: true,
        createdAt: true,
      },
    });

    // Build CSV
    const headers = ["id", "timestamp", "method", "endpoint", "url", "status", "latency_ms", "ip_address", "source", "error_code", "error_message"];
    const rows = logs.map((log: (typeof logs)[number]) => [
      toCsvCell(log.id),
      toCsvCell(log.createdAt.toISOString()),
      toCsvCell(log.method),
      toCsvCell(log.endpoint),
      toCsvCell(log.url),
      String(log.resStatus),
      String(log.latencyMs),
      toCsvCell(log.ipAddress),
      toCsvCell(log.source),
      toCsvCell(log.errorCode),
      toCsvCell(log.errorMsg),
    ]);

    const csv = [headers.join(","), ...rows.map((r: (typeof rows)[number]) => r.join(","))].join("\n");

    const filename = `api-logs-${from || "all"}-${to || "now"}.csv`;

    // Log this export request too
    finishApiLog(200, { exported: logs.length, format: "csv" });

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
