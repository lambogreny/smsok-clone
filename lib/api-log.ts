import { AsyncLocalStorage } from "node:async_hooks";
import { NextRequest } from "next/server";
import { prisma } from "./db";
import { logger } from "./logger";

// ==========================================
// Error code mapping
// ==========================================

export const ERROR_CODES = {
  VALIDATION: "1001",      // Zod validation error
  BAD_REQUEST: "1002",     // Missing/invalid fields
  NOT_FOUND: "2004",       // Resource not found
  AUTH_MISSING: "3001",    // No auth header/key
  AUTH_INVALID: "3002",    // Invalid API key
  AUTH_DISABLED: "3003",   // API key disabled
  AUTH_FAILED: "3004",     // Wrong password
  FORBIDDEN: "3005",       // Insufficient permissions
  RATE_LIMIT: "4001",      // Rate limit exceeded
  CREDITS: "4002",         // Insufficient credits
  BUSINESS: "4003",        // Business logic error (Thai validation)
  INTERNAL: "5001",        // Unexpected server error
  GATEWAY: "5002",         // SMS gateway error
} as const;

// ==========================================
// Masking utilities
// ==========================================

const SENSITIVE_HEADERS = new Set(["authorization", "x-api-key", "cookie"]);
const SENSITIVE_BODY_FIELDS = new Set([
  "password", "currentPassword", "newPassword", "confirmPassword", "token",
  "apiKey", "key", "secret", "otpCode", "code",
]);
const MAX_FIELD_LENGTH = 4000;

function maskValue(value: string): string {
  if (value.startsWith("Bearer ")) {
    const key = value.slice(7);
    return key.length > 8
      ? `Bearer ${key.slice(0, 4)}****${key.slice(-4)}`
      : "Bearer ****";
  }
  return value.length > 8
    ? `${value.slice(0, 4)}****${value.slice(-4)}`
    : "****";
}

function maskHeaders(req: NextRequest): Record<string, string> {
  const masked: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    masked[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? maskValue(value) : value;
  });
  return masked;
}

function maskBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  if (Array.isArray(body)) return body.map(maskBody);

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_BODY_FIELDS.has(key)) {
      masked[key] = typeof value === "string" && value.length > 0 ? "****" : value;
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskBody(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function truncate(str: string | null): string | null {
  if (!str) return null;
  return str.length > MAX_FIELD_LENGTH
    ? str.slice(0, MAX_FIELD_LENGTH) + "...[truncated]"
    : str;
}

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ==========================================
// AsyncLocalStorage context per request
// ==========================================

type ApiLogContext = {
  startTime: number;
  method: string;
  url: string;       // full URL with query
  endpoint: string;  // path only
  ipAddress: string;
  source: "WEB" | "API";
  reqHeaders: Record<string, string>;
  reqBody: unknown;
  userId: string | null;
  apiKeyId: string | null;
};

const logStore = new AsyncLocalStorage<ApiLogContext>();

/** Call at the start of request handling (inside authenticateApiKey or startApiLog). */
export function startApiLog(req: NextRequest) {
  const parsed = new URL(req.url);

  // Detect source: API key takes priority over session cookie
  // 1. API key header present → always "API" (curl/Postman/SDK)
  // 2. Session cookie or server-action header → "WEB" (dashboard/browser)
  // 3. Neither → "API" (unknown defaults to API)
  const hasApiKeyAuth = req.headers.has("authorization") || req.headers.has("x-api-key");
  const cookies = req.headers.get("cookie") || "";
  const hasSessionCookie = cookies.includes("next-auth.session-token") || cookies.includes("session-token");
  const hasServerActionHeader = req.headers.has("next-action");
  let source: "WEB" | "API";
  if (hasApiKeyAuth) {
    source = "API";
  } else if (hasSessionCookie || hasServerActionHeader) {
    source = "WEB";
  } else {
    source = "API";
  }

  const ctx: ApiLogContext = {
    startTime: Date.now(),
    method: req.method,
    url: parsed.pathname + parsed.search,
    endpoint: parsed.pathname,
    ipAddress: extractIp(req),
    source,
    reqHeaders: maskHeaders(req),
    reqBody: null,
    userId: null,
    apiKeyId: null,
  };

  logStore.enterWith(ctx);

  // Read body async (fire and forget)
  if (req.method !== "GET" && req.method !== "HEAD") {
    req
      .clone()
      .json()
      .then((body) => { ctx.reqBody = maskBody(body); })
      .catch(() => {});
  }

  return ctx;
}

/** Set userId after authentication succeeds. */
export function setApiLogUser(userId: string) {
  const ctx = logStore.getStore();
  if (ctx) ctx.userId = userId;
}

/** Set apiKeyId after authentication succeeds. */
export function setApiLogApiKey(apiKeyId: string) {
  const ctx = logStore.getStore();
  if (ctx) ctx.apiKeyId = apiKeyId;
}

/** Log the API response. Called from apiResponse/apiError. */
export function finishApiLog(
  resStatus: number,
  resBody: unknown,
  errorCode?: string | null,
  errorMsg?: string | null,
  stackTrace?: string | null,
) {
  const ctx = logStore.getStore();
  if (!ctx) return;

  const latencyMs = Date.now() - ctx.startTime;

  prisma.apiLog
    .create({
      data: {
        ...(ctx.userId ? { user: { connect: { id: ctx.userId } } } : {}),
        ...(ctx.apiKeyId ? { apiKey: { connect: { id: ctx.apiKeyId } } } : {}),
        method: ctx.method,
        url: ctx.url,
        endpoint: ctx.endpoint,
        source: ctx.source,
        reqHeaders: truncate(JSON.stringify(ctx.reqHeaders)),
        reqBody: truncate(JSON.stringify(ctx.reqBody)),
        resStatus,
        resBody: truncate(JSON.stringify(resBody)),
        latencyMs,
        ipAddress: ctx.ipAddress,
        errorCode: errorCode || null,
        errorMsg: errorMsg || null,
        stackTrace: stackTrace ? truncate(stackTrace) : null,
      },
    })
    .catch((err: unknown) => {
      logger.error("API log persistence failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });
}

// ==========================================
// withApiLog wrapper (for non-authenticated routes)
// ==========================================

type RouteHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function withApiLog(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    startApiLog(req);
    return handler(req, ctx);
  };
}
