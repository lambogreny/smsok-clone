import { NextRequest } from "next/server"
import { authenticateRequest, apiError, apiResponse } from "@/lib/api-auth"
import { testWebhook } from "@/lib/actions/webhooks"

type Params = { params: Promise<{ id: string }> }

// POST /api/v1/webhooks/:id/test — send a test delivery to the configured webhook URL
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req)
    const { id } = await params
    const result = await testWebhook(id, user.id)
    return apiResponse(result)
  } catch (error) {
    return apiError(error)
  }
}
