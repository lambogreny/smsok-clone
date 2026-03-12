import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getProviders, createProvider } from "@/lib/actions/admin-ops";

export async function GET(req: NextRequest) {
  try {
    await authenticateAdmin(req, ["OPERATIONS"]);
    const providers = await getProviders();
    return apiResponse({ providers });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authenticateAdmin(req, ["OPERATIONS"]);
    const body = await req.json();
    const provider = await createProvider(admin.id, body);
    return apiResponse(provider, 201);
  } catch (error) {
    return apiError(error);
  }
}
