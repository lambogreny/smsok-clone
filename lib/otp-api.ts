import { NextRequest } from "next/server";
import { authenticateRequest, ApiError, apiError, apiResponse } from "./api-auth";
import { ERROR_CODES } from "./api-log";
import { generateOtp_, verifyOtp_ } from "./actions/otp";
import { InsufficientCreditsError, type InsufficientCreditsResult } from "./quota-errors";
import { checkRateLimit, rateLimitResponse } from "./rate-limit";
import { checkOtpRateLimit } from "./otp-rate-limit";
import { sendOtpSchema, verifyOtpSchema } from "./validations";

type JsonRecord = Record<string, unknown>;

function asRecord(body: unknown): JsonRecord {
  return body && typeof body === "object" ? (body as JsonRecord) : {};
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function shouldExposeDebugOtp(req: NextRequest): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    req.headers.get("x-debug-otp") === "1"
  );
}

function pickSendInput(body: unknown) {
  const input = asRecord(body);
  return sendOtpSchema.parse({
    phone: input.phone ?? input.phoneNumber ?? input.to,
    purpose: input.purpose ?? "verify",
  });
}

function pickVerifyInput(body: unknown) {
  const input = asRecord(body);
  return verifyOtpSchema.parse({
    ref: input.ref ?? input.refCode,
    code: input.code ?? input.otpCode,
  });
}

export function isVerifyOtpRequest(body: unknown): boolean {
  const input = asRecord(body);
  return input.action === "verify" || Boolean(input.ref) || Boolean(input.refCode);
}

function isInsufficientCreditsResult(value: unknown): value is InsufficientCreditsResult {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as { error?: unknown }).error === "INSUFFICIENT_CREDITS" &&
      typeof (value as { creditsRequired?: unknown }).creditsRequired === "number" &&
      typeof (value as { creditsRemaining?: unknown }).creditsRemaining === "number",
  );
}

async function resolveRequestBody(req: NextRequest, body?: unknown) {
  if (body !== undefined) {
    return body;
  }

  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "กรุณาส่งข้อมูล JSON", ERROR_CODES.BAD_REQUEST);
  }
}

export async function handleSendOtp(req: NextRequest, body?: unknown) {
  try {
    const user = await authenticateRequest(req);
    const ip = getClientIp(req);

    const input = pickSendInput(await resolveRequestBody(req, body));

    // Redis-backed OTP rate limiting: exponential backoff + daily quota + IP limit
    const limit = await checkOtpRateLimit(input.phone, ip);
    if (!limit.allowed) {
      return Response.json(
        {
          error: limit.reason,
          retryAfter: limit.retryAfter,
          remainingToday: limit.remainingToday,
          otpExpiresIn: limit.otpExpiresIn,
          cooldownState: limit.cooldownState,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfter),
            "X-RateLimit-Remaining": String(limit.remainingToday),
          },
        }
      );
    }

    const result = await generateOtp_(user.id, input.phone, input.purpose, {
      debug: shouldExposeDebugOtp(req),
    }, "API", ip);

    if (isInsufficientCreditsResult(result)) {
      throw new InsufficientCreditsError(
        result.creditsRequired,
        result.creditsRemaining,
        result.message,
      );
    }

    return apiResponse({
      ...result,
      retryAfter: 0,
      remainingToday: limit.remainingToday,
      otpExpiresIn: limit.otpExpiresIn,
      cooldownState: "cooldown", // just sent — frontend starts countdown
    }, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function handleVerifyOtp(req: NextRequest, body?: unknown) {
  try {
    const user = await authenticateRequest(req);
    const ip = getClientIp(req);

    const input = pickVerifyInput(await resolveRequestBody(req, body));

    // IP-based rate limit on verify (still in-memory — verify doesn't need Redis backoff)
    const ipLimit = await checkRateLimit(`otp-verify:${ip}`, "otp_verify");
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.resetIn);
    }

    const refLimit = await checkRateLimit(`ref:${input.ref}`, "otp_verify");
    if (!refLimit.allowed) {
      return rateLimitResponse(refLimit.resetIn);
    }

    const result = await verifyOtp_(user.id, input.ref, input.code);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
