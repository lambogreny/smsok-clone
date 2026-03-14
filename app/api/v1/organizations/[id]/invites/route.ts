import { NextRequest } from "next/server";
import { apiResponse, apiError, ApiError, authenticateRequest } from "@/lib/api-auth";
import { createInvite, getOrgInvites, revokeInvite } from "@/lib/actions/organizations";
import { resolveOrganizationIdForUser } from "@/lib/organizations/resolve";
type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const invites = await getOrgInvites(user.id, organizationId);
    return apiResponse({ invites });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    const invite = await createInvite(user.id, organizationId, body);
    return apiResponse(invite, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    const organizationId = await resolveOrganizationIdForUser(user.id, id);
    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");
    if (!inviteId) throw new Error("กรุณาระบุ inviteId");
    await revokeInvite(user.id, organizationId, inviteId);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
