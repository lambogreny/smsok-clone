import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { suspendCustomer } from "@/lib/actions/admin-support";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await authenticateAdmin(req, ["SUPPORT"]);
    const { id } = await params;
    const body = await req.json();
    const result = await suspendCustomer(admin.id, id, body.suspend);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
