import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { registerWithOtp } from "@/lib/actions";
import { startApiLog } from "@/lib/api-log";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { registerRouteSchema } from "@/lib/validations";

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  startApiLog(req);

  // Rate limit BEFORE processing — prevents spam registration
  const ip = getClientIp(req);
  const limit = await checkRateLimit(ip, "auth_register");
  if (!limit.allowed) {
    return rateLimitResponse(limit.resetIn);
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const data = registerRouteSchema.parse(body);

    await registerWithOtp({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      otpRef: data.otpRef,
      otpCode: data.otpCode,
      acceptTerms: data.acceptTerms as boolean,
    });

    return apiResponse({ success: true, redirectTo: "/dashboard" }, 201);
  } catch (error) {
    return apiError(error);
  }
}
