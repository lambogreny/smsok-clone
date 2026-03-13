import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { registerWithOtp } from "@/lib/actions";
import { ERROR_CODES, startApiLog } from "@/lib/api-log";
import { applyRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/session-utils";
import { registerRouteSchema } from "@/lib/validations";
import { hasValidCsrfOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  startApiLog(req);

  if (!hasValidCsrfOrigin(req)) {
    return apiError(new ApiError(403, "คำขอไม่ถูกต้อง กรุณาลองใหม่", ERROR_CODES.FORBIDDEN));
  }

  // Rate limit BEFORE processing — prevents spam registration
  const ip = getClientIp(req.headers);
  const userAgent = req.headers.get("user-agent") || undefined;
  const rl = await applyRateLimit(ip, "auth_register");
  if (rl.blocked) return rl.blocked;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const data = registerRouteSchema.parse(body);

    await registerWithOtp({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      otpRef: data.otpRef,
      otpCode: data.otpCode,
      acceptTerms: data.acceptTerms,
      consentService: data.consentService,
      consentThirdParty: data.consentThirdParty,
      consentMarketing: data.consentMarketing,
      ipAddress: ip,
      userAgent,
    });

    return apiResponse({ success: true, redirectTo: "/dashboard" }, 201);
  } catch (error) {
    return apiError(error);
  }
}
