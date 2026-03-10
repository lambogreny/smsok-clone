import { NextRequest } from "next/server"
import { authenticateApiKey, ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { createWebhook, listWebhooks } from "@/lib/actions/webhooks"

// GET /api/v1/webhooks — List user's webhooks
export async function GET(req: NextRequest) {
  try {
    await authenticateApiKey(req)
    const webhooks = await listWebhooks()
    return apiResponse({ webhooks })
  } catch (error) {
    return apiError(error)
  }
}

// POST /api/v1/webhooks — Create webhook
export async function POST(req: NextRequest) {
  try {
    await authenticateApiKey(req)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON")
    }

    const { url, events } = body as { url?: string; events?: string[] }
    if (!url) throw new ApiError(400, "กรุณาระบุ URL")
    if (!events || !events.length) throw new ApiError(400, "กรุณาเลือก events")

    const webhook = await createWebhook({ url, events })
    return apiResponse({ webhook }, 201)
  } catch (error) {
    return apiError(error)
  }
}
