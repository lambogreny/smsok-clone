import { NextRequest } from "next/server";
import { authenticateApiKey, apiError, apiResponse } from "./api-auth";
import { generateOtp_, verifyOtp_ } from "./actions/otp";
import { checkRateLimit, rateLimitResponse } from "./rate-limit";
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

export async function handleSendOtp(req: NextRequest, body?: unknown) {
  try {
    const user = await authenticateApiKey(req);
    const input = pickSendInput(body ?? await req.json());
    const ip = getClientIp(req);

    const phoneLimit = checkRateLimit(`phone:${input.phone}`, "otp_generate");
    if (!phoneLimit.allowed) {
      return rateLimitResponse(phoneLimit.resetIn);
    }

    const ipLimit = checkRateLimit(`otp-send:${ip}`, "otp_generate");
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.resetIn);
    }

    const result = await generateOtp_(user.id, input.phone, input.purpose, {
      debug: shouldExposeDebugOtp(req),
    }, "API");
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function handleVerifyOtp(req: NextRequest, body?: unknown) {
  try {
    const user = await authenticateApiKey(req);
    const input = pickVerifyInput(body ?? await req.json());
    const ip = getClientIp(req);

    const refLimit = checkRateLimit(`ref:${input.ref}`, "otp_verify");
    if (!refLimit.allowed) {
      return rateLimitResponse(refLimit.resetIn);
    }

    const ipLimit = checkRateLimit(`otp-verify:${ip}`, "otp_verify");
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.resetIn);
    }

    const result = await verifyOtp_(user.id, input.ref, input.code);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
