import { AsyncLocalStorage } from "node:async_hooks";
import { NextRequest } from "next/server";
import { prisma } from "./db";

// ==========================================
// Masking utilities
// ==========================================

const SENSITIVE_HEADERS = new Set(["authorization", "x-api-key", "cookie"]);
const SENSITIVE_BODY_FIELDS = new Set([
  "password", "newPassword", "confirmPassword", "token",
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

// ==========================================
// AsyncLocalStorage context per request
// ==========================================

type ApiLogContext = {
  startTime: number;
  method: string;
  url: string;
  reqHeaders: Record<string, string>;
  reqBody: unknown;
  userId: string | null;
};

const logStore = new AsyncLocalStorage<ApiLogContext>();

/** Call at the start of request handling (inside authenticateApiKey). */
export function startApiLog(req: NextRequest) {
  let reqBody: unknown = null;
  // Body is already consumed by route handler, so we read from clone
  // Note: this must be called BEFORE req.json() in the route
  // Since authenticateApiKey runs first and doesn't consume body, this is safe

  const ctx: ApiLogContext = {
    startTime: Date.now(),
    method: req.method,
    url: new URL(req.url).pathname,
    reqHeaders: maskHeaders(req),
    reqBody: null, // filled async below
    userId: null,
  };

  logStore.enterWith(ctx);

  // Read body async (fire and forget for logging)
  if (req.method !== "GET" && req.method !== "HEAD") {
    req
      .clone()
      .json()
      .then((body) => {
        ctx.reqBody = maskBody(body);
      })
      .catch(() => {
        // non-JSON or empty body — ok
      });
  }

  return ctx;
}

/** Set userId after authentication succeeds. */
export function setApiLogUser(userId: string) {
  const ctx = logStore.getStore();
  if (ctx) ctx.userId = userId;
}

/** Log the API response. Called from apiResponse/apiError. */
export function finishApiLog(resStatus: number, resBody: unknown, errorCode?: string | null, errorMsg?: string | null) {
  const ctx = logStore.getStore();
  if (!ctx) return; // no context = not an API-logged request

  const latencyMs = Date.now() - ctx.startTime;

  prisma.apiLog
    .create({
      data: {
        userId: ctx.userId,
        method: ctx.method,
        url: ctx.url,
        reqHeaders: truncate(JSON.stringify(ctx.reqHeaders)),
        reqBody: truncate(JSON.stringify(ctx.reqBody)),
        resStatus,
        resBody: truncate(JSON.stringify(resBody)),
        latencyMs,
        errorCode: errorCode || null,
        errorMsg: errorMsg || null,
      },
    })
    .catch((err) => {
      console.error("[api-log] save failed:", err);
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
    // apiResponse/apiError will call finishApiLog automatically
  };
}
