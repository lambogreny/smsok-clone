import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

// GET /api/v1/logs/:id — full detail of request + response
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id } = await params;

    const log = await prisma.apiLog.findFirst({
      where: { id, userId: user.id },
    });

    if (!log) {
      return apiResponse({ error: "ไม่พบ log" }, 404);
    }

    return apiResponse({
      ...log,
      reqHeaders: log.reqHeaders ? JSON.parse(log.reqHeaders) : null,
      reqBody: log.reqBody ? JSON.parse(log.reqBody) : null,
      resBody: log.resBody ? JSON.parse(log.resBody) : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
