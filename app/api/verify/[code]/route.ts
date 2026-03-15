import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import {
  enforcePublicOrderDocumentVerificationRateLimit,
  getPublicOrderDocumentVerification,
} from "@/lib/orders/verify";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    await enforcePublicOrderDocumentVerificationRateLimit(_req.headers);

    const { code } = await ctx.params;
    const verification = await getPublicOrderDocumentVerification(code);

    if (!verification) {
      throw new ApiError(404, "ไม่พบเอกสาร");
    }

    return apiResponse(verification);
  } catch (error) {
    return apiError(error);
  }
}
