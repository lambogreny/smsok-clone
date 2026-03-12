import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { processRefund } from "@/lib/actions/admin-finance";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await authenticateAdmin(req, ["FINANCE"]);
    const { id } = await params;
    const body = await req.json();
    await processRefund(admin.id, id, body);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
