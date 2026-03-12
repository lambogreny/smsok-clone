import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { toggleApiKey, deleteApiKey, updateApiKeyName } from "@/lib/actions/api-keys";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const result = await toggleApiKey(user.id, id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/api-keys/:id — update API key name
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const result = await updateApiKeyName(user.id, id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    await deleteApiKey(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
