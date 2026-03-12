import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { completeOnboarding } from "@/lib/actions/onboarding";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return apiError(new ApiError(401, "Unauthorized"));

    const result = await completeOnboarding(session.id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
