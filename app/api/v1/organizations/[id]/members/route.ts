import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { getOrgMembers, updateMemberRole, removeMember } from "@/lib/actions/organizations";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const members = await getOrgMembers(user.id, id);
    return apiResponse({ members });
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
    const { memberId, ...roleData } = body as Record<string, unknown>;
    if (!memberId || typeof memberId !== "string") throw new ApiError(400, "กรุณาระบุ memberId");
    const updated = await updateMemberRole(user.id, id, memberId as string, roleData);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) throw new Error("กรุณาระบุ memberId");
    await removeMember(user.id, id, memberId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
