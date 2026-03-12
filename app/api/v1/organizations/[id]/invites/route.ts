import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { createInvite, getOrgInvites, revokeInvite } from "@/lib/actions/organizations";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const invites = await getOrgInvites(user.id, id);
    return apiResponse({ invites });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const invite = await createInvite(user.id, id, body);
    return apiResponse(invite, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");
    if (!inviteId) throw new Error("กรุณาระบุ inviteId");
    await revokeInvite(user.id, id, inviteId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
