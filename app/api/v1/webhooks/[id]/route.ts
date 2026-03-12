import { NextRequest } from "next/server"
import { authenticateRequest, ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { updateWebhook, deleteWebhook } from "@/lib/actions/webhooks"
import { updateWebhookSchema } from "@/lib/validations"

type Params = { params: Promise<{ id: string }> }

async function handleUpdateWebhook(req: NextRequest, params: Params) {
  const user = await authenticateRequest(req)
  const { id } = await params.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new ApiError(400, "กรุณาส่งข้อมูล JSON")
  }

  const data = updateWebhookSchema.parse(body)
  const webhook = await updateWebhook(id, data, user.id)
  return apiResponse({ webhook })
}

// PATCH /api/v1/webhooks/:id — Update webhook
export async function PATCH(req: NextRequest, params: Params) {
  try {
    return await handleUpdateWebhook(req, params)
  } catch (error) {
    return apiError(error)
  }
}

// PUT /api/v1/webhooks/:id — compatibility alias for older clients
export async function PUT(req: NextRequest, params: Params) {
  try {
    return await handleUpdateWebhook(req, params)
  } catch (error) {
    return apiError(error)
  }
}

// DELETE /api/v1/webhooks/:id — Delete webhook
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req)
    const { id } = await params
    await deleteWebhook(id, user.id)
    return apiResponse({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
