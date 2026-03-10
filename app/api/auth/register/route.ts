import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { registerWithOtp } from "@/lib/actions";
import { startApiLog } from "@/lib/api-log";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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
  const limit = checkRateLimit(ip, "auth");
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

    const data = body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      otpRef?: string;
      otpCode?: string;
      acceptTerms?: boolean;
    };

    if (!data.name || !data.email || !data.phone || !data.password || !data.otpRef || !data.otpCode) {
      throw new ApiError(400, "กรุณากรอกข้อมูลให้ครบถ้วน");
    }

    if (!data.acceptTerms) {
      throw new ApiError(400, "กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว");
    }

    await registerWithOtp({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      otpRef: data.otpRef,
      otpCode: data.otpCode,
      acceptTerms: data.acceptTerms,
    });

    return apiResponse({ success: true, redirectTo: "/dashboard" }, 201);
  } catch (error) {
    return apiError(error);
  }
}
