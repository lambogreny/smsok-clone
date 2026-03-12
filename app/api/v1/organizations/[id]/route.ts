import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { getOrganization, updateOrganization, deleteOrganization } from "@/lib/actions/organizations";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const org = await getOrganization(user.id, id);
    return apiResponse(org);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const org = await updateOrganization(user.id, id, body);
    return apiResponse(org);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    await deleteOrganization(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
