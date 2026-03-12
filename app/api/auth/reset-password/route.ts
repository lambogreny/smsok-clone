import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { ERROR_CODES } from "@/lib/api-log";
import { resetPassword } from "@/lib/actions/auth";
import { resetPasswordSchema } from "@/lib/validations";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { hasValidCsrfOrigin } from "@/lib/csrf";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  if (!hasValidCsrfOrigin(req)) {
    return apiError(new ApiError(403, "CSRF: invalid origin", ERROR_CODES.FORBIDDEN));
  }

  // Rate limit BEFORE processing — prevents token brute-force
  const ip = getClientIp(req);
  const limit = await checkRateLimit(ip, "password");
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn);
  }

  try {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);
    const result = await resetPassword(input);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
