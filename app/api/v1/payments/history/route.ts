import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";

// TODO: Re-implement with new payment provider (Omise removed)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return apiError(new ApiError(401, "Unauthorized"));

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    return apiResponse({ payments: [], page, limit, total: 0 });
  } catch (error) {
    return apiError(error);
  }
}
