import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { processOptOut, getOptOutLogs } from "@/lib/actions/pdpa";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const logs = await getOptOutLogs(user.id, null, page, limit);
    return apiResponse(logs);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticatePublicApiKey(req);
    const body = await req.json();
    const result = await processOptOut(user.id, null, body);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
