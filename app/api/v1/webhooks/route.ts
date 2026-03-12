import { NextRequest } from "next/server"
import { authenticateRequest, ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { createWebhook, listWebhooks } from "@/lib/actions/webhooks"
import { createWebhookSchema } from "@/lib/validations"

// GET /api/v1/webhooks — List user's webhooks
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)
    const webhooks = await listWebhooks(user.id)
    return apiResponse({ webhooks })
  } catch (error) {
    return apiError(error)
  }
}

// POST /api/v1/webhooks — Create webhook
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON")
    }

    const { url, events } = createWebhookSchema.parse(body)

    const webhook = await createWebhook({ url, events, userId: user.id })
    return apiResponse({ webhook }, 201)
  } catch (error) {
    return apiError(error)
  }
}
