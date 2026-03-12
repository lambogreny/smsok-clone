import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { updateOnboardingProgress } from "@/lib/actions/onboarding";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) return apiError(new ApiError(401, "Unauthorized"));

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }
    if (!(body as Record<string, unknown>).step) {
      return apiError(new ApiError(400, "กรุณาระบุ step"));
    }

    const result = await updateOnboardingProgress(session.id, (body as Record<string, unknown>).step as string);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
