import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/logs/:id — full detail of request + response
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const log = await prisma.apiLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!log) {
      return apiResponse({ error: "ไม่พบ log" }, 404);
    }

    // Parse JSON fields for structured response
    const result: Record<string, unknown> = {
      id: log.id,
      userId: log.userId,
      apiKeyId: log.apiKeyId,
      method: log.method,
      url: log.url,
      endpoint: log.endpoint,
      reqHeaders: log.reqHeaders ? JSON.parse(log.reqHeaders) : null,
      reqBody: log.reqBody ? JSON.parse(log.reqBody) : null,
      resStatus: log.resStatus,
      resBody: log.resBody ? JSON.parse(log.resBody) : null,
      latencyMs: log.latencyMs,
      ipAddress: log.ipAddress,
      source: log.source,
      errorCode: log.errorCode,
      errorMsg: log.errorMsg,
      createdAt: log.createdAt,
    };

    // stackTrace: only for admin or log owner
    if (user.role === "admin" && log.stackTrace) {
      result.stackTrace = log.stackTrace;
    }

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
