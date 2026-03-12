import { NextRequest } from "next/server"
import { authenticateRequest, apiError, apiResponse } from "@/lib/api-auth"
import { getWebhookLogs } from "@/lib/actions/webhooks"

// GET /api/v1/webhooks/:id/logs — Get webhook delivery logs
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req)
    const { id } = await params

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") ?? "1", 10)
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10)

    const result = await getWebhookLogs(id, { page, limit }, user.id)
    return apiResponse(result)
  } catch (error) {
    return apiError(error)
  }
}
