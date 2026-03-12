import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { escalateTicket } from "@/lib/actions/admin-support";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await authenticateAdmin(req, ["SUPPORT"]);
    const { id } = await params;
    const result = await escalateTicket(admin.id, id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
