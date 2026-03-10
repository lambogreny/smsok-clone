import { NextRequest } from "next/server"
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth"
import { rotateWebhookSecret } from "@/lib/actions/webhooks"

type Params = { params: Promise<{ id: string }> }

// POST /api/v1/webhooks/:id/rotate-secret — Rotate webhook signing secret
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await authenticateApiKey(req)
    const { id } = await params
    const result = await rotateWebhookSecret(id)
    return apiResponse(result)
  } catch (error) {
    return apiError(error)
  }
}
