import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getTicketDetail, updateTicket } from "@/lib/actions/admin-support";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const { id } = await params;
    const ticket = await getTicketDetail(id);
    return apiResponse({ ticket });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await authenticateAdmin(req, ["SUPPORT"]);
    const { id } = await params;
    const body = await req.json();
    const ticket = await updateTicket(id, body);
    return apiResponse({ ticket });
  } catch (error) {
    return apiError(error);
  }
}
