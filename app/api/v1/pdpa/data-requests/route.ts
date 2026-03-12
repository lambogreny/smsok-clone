import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { createDataRequest, getDataRequests } from "@/lib/actions/pdpa";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const result = await getDataRequests(user.id, null, status, page, limit);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await authenticatePublicApiKey(req);
    const body = await req.json();
    const request = await createDataRequest(null, body);
    return apiResponse(request, 201);
  } catch (error) {
    return apiError(error);
  }
}
