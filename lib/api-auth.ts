import { prisma as db } from "./db";
import { NextRequest } from "next/server";

/**
 * Authenticate API request via Bearer token
 * Checks ApiKey model first, then falls back to User.apiKey
 */
export async function authenticateApiKey(req: NextRequest) {
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
  return Response.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    // Log unexpected server errors for debugging
    if (process.env.NODE_ENV !== "production" || process.env.DEBUG_API_ERRORS === "1") {
      console.error("[apiError]", error.name, error.message, error.stack);
    } else {
      console.error("[apiError]", error.name, ":", error.message);
    }

    const zodIssues =
      error.name === "ZodError" && "issues" in error && Array.isArray((error as { issues?: unknown[] }).issues)
        ? ((error as { issues: Array<{ message?: string }> }).issues)
        : null;

    // Known validation/business logic errors → 400, expose message
    const msg = zodIssues?.[0]?.message || error.message;
    const isValidation =
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
      error.name === "ZodError";
    // For unexpected server errors (5xx), never expose raw message — may leak internals
    return Response.json(
      { error: isValidation ? msg : "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่" },
      { status: isValidation ? 400 : 500 }
    );
  }
  console.error("[apiError] unknown error type:", typeof error, error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
