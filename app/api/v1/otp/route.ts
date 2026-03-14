import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { ERROR_CODES } from "@/lib/api-log";
import { handleSendOtp, handleVerifyOtp, isVerifyOtpRequest } from "@/lib/otp-api";
import { getClientIp } from "@/lib/session-utils";
import { sendOtpSchema, verifyOtpSchema } from "@/lib/validations";

// POST /api/v1/otp — generate or verify OTP
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    let body: Record<string, unknown>;
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON", ERROR_CODES.BAD_REQUEST);
    }

    if (isVerifyOtpRequest(body)) {
      verifyOtpSchema.parse({
        ref: body.ref ?? body.refCode,
        code: body.code ?? body.otpCode,
      });
      return handleVerifyOtp(req, body);
    }
    sendOtpSchema.parse({
      phone: body.phone ?? body.phoneNumber ?? body.to,
      purpose: body.purpose ?? "verify",
    });
    return handleSendOtp(req, body);
  } catch (error) {
    return apiError(error);
  }
}
