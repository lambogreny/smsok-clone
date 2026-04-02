import { prisma as db } from "./db";
import { NextRequest } from "next/server";
import { startApiLog, setApiLogUser, setApiLogApiKey, finishApiLog, ERROR_CODES } from "./api-log";
import { hashApiKey } from "./crypto-utils";
import { InsufficientCreditsError } from "./quota-errors";
import { trustActionUserId } from "./action-user";
import { hasValidCsrfOrigin } from "./csrf";
import { getClientIp } from "./session-utils";
import { logger } from "./logger";
import {
  hasApiKeyPermission,
  normalizeApiKeyPermissions,
  resolveApiKeyRoutePermission,
} from "./api-key-permissions";

/**
 * Authenticate API request via Bearer token
 * Checks ApiKey model first, then falls back to User.apiKey
 */
export async function authenticateApiKey(req: NextRequest) {
  startApiLog(req);

  const authHeader = req.headers.get("authorization");
  const headerApiKey = req.headers.get("x-api-key")?.trim();

  if (authHeader && !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "กรุณาระบุ API Key", ERROR_CODES.AUTH_MISSING);
  }

  const key = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : headerApiKey;

  if (!key) {
    throw new ApiError(401, "กรุณาระบุ API Key", ERROR_CODES.AUTH_MISSING);
  }

  if (!key.startsWith("sk_live_") || key.length < 20) {
    throw new ApiError(401, "รูปแบบ API Key ไม่ถูกต้อง", ERROR_CODES.AUTH_INVALID);
  }

  const keyHash = hashApiKey(key);

  const apiKey = await db.apiKey.findUnique({
    where: { key: keyHash },
    select: {
      id: true,
      isActive: true,
      revokedAt: true,
      permissions: true,
      rateLimit: true,
      ipWhitelist: true,
      userId: true,
      user: { select: { id: true, role: true } },
    },
  });

  if (!apiKey) {
    throw new ApiError(401, "API Key ไม่ถูกต้อง", ERROR_CODES.AUTH_INVALID);
  }

  if (!apiKey.isActive) {
    throw new ApiError(401, "API Key ถูกปิดใช้งาน", ERROR_CODES.AUTH_DISABLED);
  }

  if (apiKey.revokedAt) {
    throw new ApiError(401, "API Key ถูกเพิกถอนแล้ว", ERROR_CODES.AUTH_DISABLED);
  }

  if (!apiKey.user) {
    throw new ApiError(401, "API Key ไม่ถูกต้อง", ERROR_CODES.AUTH_INVALID);
  }

  const clientIp = getClientIp(req.headers) || (req as NextRequest & { ip?: string }).ip || "unknown";

  if (apiKey.ipWhitelist.length > 0 && !apiKey.ipWhitelist.includes(clientIp)) {
    throw new ApiError(
      403,
      "IP นี้ไม่ได้รับอนุญาตสำหรับ API Key นี้",
      ERROR_CODES.FORBIDDEN,
    );
  }

  const grantedPermissions = normalizeApiKeyPermissions(apiKey.permissions);
  const requiredPermission = resolveApiKeyRoutePermission(
    req.nextUrl.pathname,
    req.method,
  );

  if (requiredPermission === "session-only") {
    throw new ApiError(
      403,
      "ปลายทางนี้ต้องใช้การเข้าสู่ระบบ",
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (!requiredPermission) {
    throw new ApiError(
      403,
      "API Key ไม่สามารถใช้กับปลายทางนี้",
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (!hasApiKeyPermission(grantedPermissions, requiredPermission)) {
    throw new ApiError(
      403,
      "API Key ไม่มีสิทธิ์เข้าถึง",
      ERROR_CODES.FORBIDDEN,
    );
  }

  db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }).catch(() => {});

  setApiLogUser(apiKey.user.id);
  setApiLogApiKey(apiKey.id);
  trustActionUserId(apiKey.user.id, req.headers.get("x-request-id"));

  return {
    ...apiKey.user,
    apiKeyId: apiKey.id,
    apiKeyPermissions: grantedPermissions,
  };
}

/**
 * Authenticate via session cookie OR API key (Bearer token).
 * Tries session first, falls back to API key.
 */
export async function authenticateRequest(req: NextRequest) {
  const { getSession } = await import("./auth");
  const session = await getSession({ headers: req.headers });
  if (session?.id) {
    const isMutatingRequest = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
    const isBrowserSessionApiRequest = req.nextUrl.pathname.startsWith("/api/v1/");
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const hasExplicitApiKey = Boolean(
      req.headers.get("x-api-key") ||
      (bearerToken.startsWith("sk_live_") && bearerToken.length >= 20),
    );

    if (isMutatingRequest && isBrowserSessionApiRequest && !hasExplicitApiKey && !hasValidCsrfOrigin(req)) {
      throw new ApiError(403, "CSRF: invalid origin", ERROR_CODES.FORBIDDEN);
    }

    trustActionUserId(session.id, req.headers.get("x-request-id"));
    return { id: session.id, role: session.role };
  }

  return authenticateApiKey(req);
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

function buildErrorLogMeta(error: Error): Record<string, unknown> {
  return {
    errorName: error.name,
    message: error.message,
    ...(error.stack ? { stack: error.stack } : {}),
    ...("code" in error && typeof (error as { code?: unknown }).code === "string"
      ? { code: (error as { code: string }).code }
      : {}),
  };
}

export function apiError(error: unknown) {
  if (error instanceof InsufficientCreditsError) {
    const body = {
      error: error.code,
      message: error.message,
      creditsRequired: error.creditsRequired,
      creditsRemaining: error.creditsRemaining,
      requiredCredits: error.creditsRequired,
      remainingCredits: error.creditsRemaining,
      code: ERROR_CODES.CREDITS,
    };
    finishApiLog(402, body, ERROR_CODES.CREDITS, error.message, error.stack);
    return Response.json(body, { status: 402 });
  }

  if (error instanceof ApiError) {
    const body = { error: error.message, code: error.code || ERROR_CODES.BAD_REQUEST };
    finishApiLog(error.status, body, body.code, error.message);
    return Response.json(body, { status: error.status });
  }

  if (
    error instanceof SyntaxError &&
    /json|unexpected token|unexpected end/i.test(error.message)
  ) {
    const body = { error: "รูปแบบ JSON ไม่ถูกต้อง", code: ERROR_CODES.BAD_REQUEST };
    finishApiLog(400, body, ERROR_CODES.BAD_REQUEST, body.error, error.stack);
    return Response.json(body, { status: 400 });
  }

  // Handle Prisma unique constraint violation (race condition fallback)
  if (error instanceof Error && "code" in error) {
    const prismaCode = (error as { code: string }).code;

    if (prismaCode === "P2002") {
      const body = { error: "ข้อมูลซ้ำ กรุณาตรวจสอบและลองใหม่", code: ERROR_CODES.BUSINESS };
      finishApiLog(409, body, ERROR_CODES.BUSINESS, body.error);
      return Response.json(body, { status: 409 });
    }

    if (prismaCode === "P2025") {
      const body = { error: "ไม่พบข้อมูล", code: ERROR_CODES.NOT_FOUND };
      finishApiLog(404, body, ERROR_CODES.NOT_FOUND, body.error);
      return Response.json(body, { status: 404 });
    }

    if (prismaCode === "P2003") {
      const body = { error: "ข้อมูลอ้างอิงไม่ถูกต้อง", code: ERROR_CODES.BUSINESS };
      finishApiLog(400, body, ERROR_CODES.BUSINESS, body.error);
      return Response.json(body, { status: 400 });
    }
  }

  if (error instanceof Error) {
    logger.error("Unhandled API error", buildErrorLogMeta(error));

    if (error.name === "ZodError") {
      const body = { error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่", code: ERROR_CODES.VALIDATION };
      finishApiLog(400, body, ERROR_CODES.VALIDATION, body.error, error.stack);
      return Response.json(body, { status: 400 });
    }

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
      msg.includes("อยู่แล้ว") ||
      msg.includes("ถูกล็อค") ||
      msg.includes("หากเบอร์") ||
      msg.includes("ระบบยังไม่พร้อม") ||
      msg.includes("ต้อง");

    let code: string = ERROR_CODES.INTERNAL;
    if (isThaiValidation) {
      if (msg.includes("ไม่พบ")) code = ERROR_CODES.NOT_FOUND;
      else if (msg.includes("เครดิตไม่เพียงพอ") || msg.includes("SMS ไม่เพียงพอ") || msg.includes("ข้อความไม่เพียงพอ")) code = ERROR_CODES.CREDITS;
      else if (msg.includes("มากเกินไป") || msg.includes("บ่อยเกินไป")) code = ERROR_CODES.RATE_LIMIT;
      else code = ERROR_CODES.BUSINESS;
    }

    const isDuplicate = msg.includes("อยู่แล้ว");
    const status =
      isThaiValidation && code === ERROR_CODES.CREDITS ? 402
        : isThaiValidation && isDuplicate ? 409
        : isThaiValidation ? 400 : 500;
    const body = {
      error: isThaiValidation ? msg : (process.env.NODE_ENV !== "production" ? msg : "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่"),
      code,
    };
    finishApiLog(status, body, code, body.error, error.stack);
    return Response.json(body, { status });
  }
  logger.error("Unhandled API error received non-Error value", {
    valueType: typeof error,
    value: error,
  });
  const body = { error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่", code: ERROR_CODES.INTERNAL };
  finishApiLog(500, body, ERROR_CODES.INTERNAL, body.error);
  return Response.json(body, { status: 500 });
}

export function apiSensitiveError(
  error: unknown,
  fallbackMessage = "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่",
  status = 500,
) {
  if (
    error instanceof InsufficientCreditsError ||
    error instanceof ApiError ||
    (error instanceof SyntaxError && /json|unexpected token|unexpected end/i.test(error.message))
  ) {
    return apiError(error);
  }

  if (error instanceof Error) {
    logger.error("Sensitive API error", buildErrorLogMeta(error));
  } else {
    logger.error("Sensitive API error received non-Error value", {
      valueType: typeof error,
      value: error,
    });
  }

  const body = {
    error: process.env.NODE_ENV === "production"
      ? fallbackMessage
      : error instanceof Error
        ? error.message
        : fallbackMessage,
    code: ERROR_CODES.INTERNAL,
  };

  finishApiLog(
    status,
    body,
    ERROR_CODES.INTERNAL,
    fallbackMessage,
    error instanceof Error ? error.stack : undefined,
  );

  return Response.json(body, { status });
}
