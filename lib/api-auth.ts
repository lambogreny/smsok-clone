import { prisma as db } from "./db";
import { NextRequest } from "next/server";
import { startApiLog, setApiLogUser, finishApiLog } from "./api-log";

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
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const key = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : headerApiKey;

  if (!key) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const apiKey = await db.apiKey.findUnique({
    where: { key },
    select: { id: true, isActive: true, userId: true, user: { select: { id: true, credits: true, role: true } } },
  });

  if (!apiKey) {
    throw new ApiError(401, "Invalid API key");
  }

  if (!apiKey.isActive) {
    throw new ApiError(401, "API key is disabled");
  }

  // Update lastUsed (fire and forget)
  db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }).catch(() => {});

  // Set userId for API logging
  setApiLogUser(apiKey.user.id);

  return apiKey.user;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
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
    const body = { error: error.message };
    finishApiLog(error.status, body, "CLIENT_ERROR", error.message);
    return Response.json(body, { status: error.status });
  }
  if (error instanceof Error) {
    // Log unexpected server errors for debugging
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG_API_ERRORS === "1") {
      console.error("[apiError]", error.name, error.message, error.stack);
    } else {
      console.error("[apiError]", error.name, ":", error.message);
    }

    // Zod validation errors → always return generic Thai message (never expose field details)
    if (error.name === "ZodError") {
      const body = { error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่", code: "VALIDATION_ERROR" };
      finishApiLog(400, body, "VALIDATION_ERROR", body.error);
      return Response.json(body, { status: 400 });
    }

    // Known Thai validation/business logic errors → 400, expose message
    const msg = error.message;
    const isThaiValidation =
      msg.includes("ไม่ถูกต้อง") ||
      msg.includes("ไม่พบ") ||
      msg.includes("ไม่เพียงพอ") ||
      msg.includes("มากเกินไป") ||
      msg.includes("สูงสุด") ||
      msg.includes("หมดอายุ") ||
      msg.includes("ยังไม่ได้") ||
      msg.includes("กรุณา") ||
      msg.includes("ไม่สำเร็จ") ||
      msg.includes("ใช้งานแล้ว") ||
      msg.includes("ถูกล็อค") ||
      msg.includes("หากเบอร์") ||
      msg.includes("ระบบยังไม่พร้อม");
    const status = isThaiValidation ? 400 : 500;
    const body = { error: isThaiValidation ? msg : "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่" };
    finishApiLog(status, body, status >= 500 ? "INTERNAL_ERROR" : "CLIENT_ERROR", body.error);
    return Response.json(body, { status });
  }
  console.error("[apiError] unknown error type:", typeof error, error);
  const body = { error: "Internal server error" };
  finishApiLog(500, body, "INTERNAL_ERROR", body.error);
  return Response.json(body, { status: 500 });
}
