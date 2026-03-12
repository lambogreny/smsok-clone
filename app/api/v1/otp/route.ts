import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { ERROR_CODES } from "@/lib/api-log";
import { handleSendOtp, handleVerifyOtp, isVerifyOtpRequest } from "@/lib/otp-api";
import { sendOtpSchema, verifyOtpSchema } from "@/lib/validations";

// POST /api/v1/otp — generate or verify OTP
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { applyRateLimit } = await import("@/lib/rate-limit");

    let body: Record<string, unknown>;
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON", ERROR_CODES.BAD_REQUEST);
    }

    if (isVerifyOtpRequest(body)) {
      const rlVerify = await applyRateLimit(ip, "otp_verify");
      if (rlVerify.blocked) return rlVerify.blocked;
      verifyOtpSchema.parse({
        ref: body.ref ?? body.refCode,
        code: body.code ?? body.otpCode,
      });
      return handleVerifyOtp(req, body);
    }
    const rlSend = await applyRateLimit(ip, "otp_send");
    if (rlSend.blocked) return rlSend.blocked;
    sendOtpSchema.parse({
      phone: body.phone ?? body.phoneNumber ?? body.to,
      purpose: body.purpose ?? "verify",
    });
    return handleSendOtp(req, body);
  } catch (error) {
    return apiError(error);
  }
}
