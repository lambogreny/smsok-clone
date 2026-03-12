import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { updateProvider } from "@/lib/actions/admin-ops";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await authenticateAdmin(req, ["OPERATIONS"]);
    const { id } = await params;
    const body = await req.json();
    const provider = await updateProvider(id, body);
    return apiResponse(provider);
  } catch (error) {
    return apiError(error);
  }
}
