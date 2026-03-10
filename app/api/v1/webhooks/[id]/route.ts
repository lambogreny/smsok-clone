import { NextRequest } from "next/server"
import { authenticateApiKey, ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { updateWebhook, deleteWebhook, testWebhook } from "@/lib/actions/webhooks"

type Params = { params: Promise<{ id: string }> }

// PUT /api/v1/webhooks/:id — Update webhook
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await authenticateApiKey(req)
    const { id } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON")
    }

    const { url, events, active } = body as {
      url?: string
      events?: string[]
      active?: boolean
    }

    const webhook = await updateWebhook(id, { url, events, active })
    return apiResponse({ webhook })
  } catch (error) {
    return apiError(error)
  }
}

// DELETE /api/v1/webhooks/:id — Delete webhook
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await authenticateApiKey(req)
    const { id } = await params
    await deleteWebhook(id)
    return apiResponse({ success: true })
  } catch (error) {
    return apiError(error)
  }
}

// POST /api/v1/webhooks/:id/test — handled via query param or separate route
// Using PATCH as test action
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await authenticateApiKey(req)
    const { id } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const { action } = (body as { action?: string }) || {}
    if (action === "test") {
      const result = await testWebhook(id)
      return apiResponse(result)
    }

    throw new ApiError(400, "กรุณาระบุ action: test")
  } catch (error) {
    return apiError(error)
  }
}
