import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { createInvite } from "@/lib/actions/organizations";
type Params = { params: Promise<{ id: string }> };

// POST /api/organizations/:id/members/invite — invite a member into organization
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const invite = await createInvite(session.id, id, body);
    return apiResponse(invite, 201);
  } catch (error) {
    return apiError(error);
  }
}
