import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { ERROR_CODES } from "@/lib/api-log";
import { forgotPassword } from "@/lib/actions/auth";
import { forgotPasswordSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasValidCsrfOrigin } from "@/lib/csrf";

const GENERIC_MESSAGE = "หากเบอร์นี้ลงทะเบียนไว้ จะได้รับ SMS";

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

  const ip = getClientIp(req);
  const limit = await checkRateLimit(ip, "password");

  if (limit.allowed) {
    try {
      const body = await req.json().catch(() => ({}));
      const parsed = forgotPasswordSchema.safeParse(body);
      if (parsed.success) {
        await forgotPassword(parsed.data);
      }
    } catch {
      // Swallow all errors to avoid revealing whether the user exists.
    }
  }

  return apiResponse({ message: GENERIC_MESSAGE });
}
