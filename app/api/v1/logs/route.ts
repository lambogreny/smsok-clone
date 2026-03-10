import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/logs?page=1&limit=20&status=400&endpoint=/sms/send&method=POST&from=2026-03-01&to=2026-03-10
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const status = searchParams.get("status");
    const endpoint = searchParams.get("endpoint");
    const method = searchParams.get("method");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const errorCode = searchParams.get("errorCode");
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };

    if (status) {
      where.resStatus = parseInt(status, 10);
    }
    if (endpoint) {
      where.url = { contains: endpoint };
    }
    if (method) {
      where.method = method.toUpperCase();
    }
    if (errorCode) {
      where.errorCode = errorCode;
    }
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          method: true,
          url: true,
          resStatus: true,
          latencyMs: true,
          errorCode: true,
          errorMsg: true,
          createdAt: true,
        },
      }),
      prisma.apiLog.count({ where }),
    ]);

    return apiResponse({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiError(error);
  }
}
