import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { processDataRequest } from "@/lib/actions/pdpa";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { id } = await params;
    const body = await req.json();
    const result = await processDataRequest(user.id, id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
