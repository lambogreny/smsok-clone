import { prisma as db } from "./db";
import { NextRequest } from "next/server";
import { startApiLog, setApiLogUser, setApiLogApiKey, finishApiLog, ERROR_CODES } from "./api-log";
import { hashApiKey } from "./crypto-utils";

/**
 * Authenticate API request via Bearer token
 * Checks ApiKey model first, then falls back to User.apiKey
 */
export async function authenticateApiKey(req: NextRequest) {
  // Start API request logging
  startApiLog(req);

  const authHeader = req.headers.get("authorization");
  const headerApiKey = req.headers.get("x-api-key")?.trim();

  if (authHeader && !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header", ERROR_CODES.AUTH_MISSING);
  }

  const key = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : headerApiKey;

  if (!key) {
    throw new ApiError(401, "Missing or invalid Authorization header", ERROR_CODES.AUTH_MISSING);
  }

  // Validate key format before hitting DB
  if (!key.startsWith("sk_live_") || key.length < 20) {
    throw new ApiError(401, "Invalid API key format", ERROR_CODES.AUTH_INVALID);
  }

  // Hash key for lookup (keys stored as SHA-256 hashes)
  const keyHash = hashApiKey(key);

  const apiKey = await db.apiKey.findUnique({
    where: { key: keyHash },
    select: {
      id: true,
      isActive: true,
      userId: true,
      user: { select: { id: true, credits: true, role: true } },
    },
  });

  if (!apiKey) {
    throw new ApiError(401, "Invalid API key", ERROR_CODES.AUTH_INVALID);
  }

  if (!apiKey.isActive) {
    throw new ApiError(401, "API key is disabled", ERROR_CODES.AUTH_DISABLED);
  }

  // Ensure associated user still exists and is valid
  if (!apiKey.user) {
    throw new ApiError(401, "API key owner not found", ERROR_CODES.AUTH_INVALID);
  }

  // Update lastUsed (fire and forget)
  db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }).catch(() => {});

  // Set userId + apiKeyId for API logging
  setApiLogUser(apiKey.user.id);
  setApiLogApiKey(apiKey.id);

  return apiKey.user;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export function apiResponse(data: unknown, status = 200) {
  finishApiLog(status, data);
  return Response.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    const body = { error: error.message, code: error.code || ERROR_CODES.BAD_REQUEST };
    finishApiLog(error.status, body, body.code, error.message);
    return Response.json(body, { status: error.status });
  }
  if (error instanceof Error) {
    // Log unexpected server errors for debugging
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG_API_ERRORS === "1") {
      console.error("[apiError]", error.name, error.message, error.stack);
    } else {
      console.error("[apiError]", error.name, ":", error.message);
    }

    // Zod validation errors → generic Thai message, error code 1001
    if (error.name === "ZodError") {
      const body = { error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่", code: ERROR_CODES.VALIDATION };
      finishApiLog(400, body, ERROR_CODES.VALIDATION, body.error, error.stack);
      return Response.json(body, { status: 400 });
    }

    // Known Thai validation/business logic errors → 400
    const msg = error.message;
    const isThaiValidation =
      msg.includes("ไม่ถูกต้อง") ||
      msg.includes("ไม่พบ") ||
      msg.includes("ไม่เพียงพอ") ||
      msg.includes("ไม่อยู่") ||
      msg.includes("ไม่มี") ||
      msg.includes("มากเกินไป") ||
      msg.includes("สูงสุด") ||
      msg.includes("หมดอายุ") ||
      msg.includes("ยังไม่ได้") ||
      msg.includes("กรุณา") ||
      msg.includes("ไม่สำเร็จ") ||
      msg.includes("ใช้งานแล้ว") ||
      msg.includes("มีอยู่แล้ว") ||
      msg.includes("ถูกล็อค") ||
      msg.includes("หากเบอร์") ||
      msg.includes("ระบบยังไม่พร้อม") ||
      msg.includes("ต้อง");

    // Classify error code
    let code: string = ERROR_CODES.INTERNAL;
    if (isThaiValidation) {
      if (msg.includes("ไม่พบ")) code = ERROR_CODES.NOT_FOUND;
      else if (msg.includes("เครดิตไม่เพียงพอ")) code = ERROR_CODES.CREDITS;
      else if (msg.includes("มากเกินไป") || msg.includes("บ่อยเกินไป")) code = ERROR_CODES.RATE_LIMIT;
      else code = ERROR_CODES.BUSINESS;
    }

    const status = isThaiValidation ? 400 : 500;
    const body = {
      error: isThaiValidation ? msg : "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่",
      code,
    };
    finishApiLog(status, body, code, body.error, error.stack);
    return Response.json(body, { status });
  }
  console.error("[apiError] unknown error type:", typeof error, error);
  const body = { error: "Internal server error", code: ERROR_CODES.INTERNAL };
  finishApiLog(500, body, ERROR_CODES.INTERNAL, body.error);
  return Response.json(body, { status: 500 });
}
