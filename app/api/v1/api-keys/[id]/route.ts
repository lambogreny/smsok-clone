import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError, authenticateRequest } from "@/lib/api-auth";
import {
  getApiKeyForUser,
  deleteApiKeyForUser,
  toggleApiKeyForUser,
  updateApiKeyNameForUser,
} from "@/lib/api-keys/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const result = await getApiKeyForUser(user.id, id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

async function readJsonBody(req: NextRequest, required: boolean) {
  const rawBody = await req.text();

  if (!rawBody.trim()) {
    if (required) {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const body = await readJsonBody(req, false);

    if (body && typeof body === "object" && "name" in body) {
      const result = await updateApiKeyNameForUser(user.id, id, body);
      return apiResponse(result);
    }

    const result = await toggleApiKeyForUser(user.id, id);
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
    const user = await authenticateRequest(req);
    const { id } = await params;
    const body = await readJsonBody(req, true);
    const result = await updateApiKeyNameForUser(user.id, id, body);
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
    const user = await authenticateRequest(req);
    const { id } = await params;
    await deleteApiKeyForUser(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
