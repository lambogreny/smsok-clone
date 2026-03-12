import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { getOnboardingStatus } from "@/lib/actions/onboarding";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return apiError(new ApiError(401, "Unauthorized"));

    const result = await getOnboardingStatus(session.id);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
