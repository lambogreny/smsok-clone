import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, verifySessionJwt } from "@/lib/session-jwt";
import { getAllowedOrigins, hasValidCsrfOrigin } from "@/lib/csrf";

const ADMIN_SESSION_COOKIE_NAME = "admin_session";

const PUBLIC_API_ANON_PATHS = new Set([
  "/api/v1/docs",
  "/api/v1/docs/openapi.json",
  "/api/v1/packages",
  "/api/v1/payments/packages",
  "/api/v1/payments/bank-accounts",
]);
const PUBLIC_SESSION_PAGES = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

function applySecurityHeaders(response: NextResponse, _pathname: string) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // CSP is handled by Nginx (infra/nginx.conf line 66) to avoid dual-header conflicts

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

function applyApiHeaders(response: NextResponse, origin: string | null) {
  if (origin && getAllowedOrigins().includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin, Authorization, X-API-Key");
  response.headers.set("Access-Control-Expose-Headers", "X-Request-Id");
}

function shouldVerifySession(pathname: string, hasApiKeyAuth: boolean) {
  if (pathname.startsWith("/api/auth/")) return false;
  if (pathname.startsWith("/api/health")) return false;
  if (pathname.startsWith("/api/storage/")) return false;
  if (pathname.startsWith("/api/v1/admin/")) return false;
  if (pathname === "/dashboard/api-docs") return false;
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/v1/")) {
      return !hasApiKeyAuth && !PUBLIC_API_ANON_PATHS.has(pathname);
    }
    return true;
  }
  return false;
}

function shouldVerifyAdminSession(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function getAdminJwtSecretForMiddleware() {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_JWT_SECRET env var required");
  }

  return null;
}

async function verifyAdminSessionToken(token: string) {
  const secret = getAdminJwtSecretForMiddleware();
  if (!secret) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    return (
      payload.type === "admin" &&
      typeof payload.adminId === "string" &&
      typeof payload.role === "string" &&
      typeof payload.sessionId === "string" &&
      typeof payload.jti === "string"
    );
  } catch {
    return false;
  }
}

function isPageNavigation(pathname: string) {
  return !pathname.startsWith("/api/");
}

function unauthorizedResponse(req: NextRequest, base: NextResponse, pathname: string) {
  if (isPageNavigation(pathname)) {
    const target = new URL("/login", req.url);
    const redirect = NextResponse.redirect(target);
    applySecurityHeaders(redirect, target.pathname);
    redirect.headers.set("X-Request-Id", base.headers.get("X-Request-Id") || crypto.randomUUID());
    redirect.cookies.delete("session");
    redirect.cookies.delete("refresh_token");
    return redirect;
  }

  const headers = new Headers(base.headers);
  headers.set("Content-Type", "application/json");
  const response = new NextResponse(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers },
  );
  response.cookies.delete("session");
  response.cookies.delete("refresh_token");
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key")?.trim();
  const hasApiKeyAuth = Boolean(authHeader || apiKey);
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const adminSessionToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const hasSessionCookies = Boolean(accessToken || refreshToken || adminSessionToken);

  // Forward pathname to server components (for conditional auth in layout)
  requestHeaders.set("x-pathname", pathname);

  // Generate or propagate X-Request-Id on every request
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  const orderDocumentMatch = pathname.match(/^\/api\/v1\/orders\/([^/]+)\/documents\/([^/]+)$/);
  if (orderDocumentMatch && req.method === "GET") {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = `/order-documents/${orderDocumentMatch[1]}/${orderDocumentMatch[2]}`;
    const rewrite = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    rewrite.headers.set("X-Request-Id", requestId);
    applySecurityHeaders(rewrite, rewriteUrl.pathname);
    return rewrite;
  }

  const legacyOrderSlipMatch = pathname.match(/^\/api\/v1\/orders\/([^/]+)\/(?:upload|verify-slip)$/);
  if (legacyOrderSlipMatch && req.method === "POST") {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = `/api/orders/${legacyOrderSlipMatch[1]}/slip`;
    const rewrite = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    rewrite.headers.set("X-Request-Id", requestId);
    applySecurityHeaders(rewrite, rewriteUrl.pathname);
    applyApiHeaders(rewrite, req.headers.get("origin"));
    return rewrite;
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.delete("Content-Type");

  // Attach X-Request-Id to every response
  response.headers.set("X-Request-Id", requestId);

  applySecurityHeaders(response, pathname);

  // --- CORS for API routes ---
  if (pathname.startsWith("/api/v1/")) {
    const origin = req.headers.get("origin");
    applyApiHeaders(response, origin);

    // Preflight
    if (req.method === "OPTIONS") {
      const preflightHeaders = new Headers(response.headers);
      preflightHeaders.set("X-Request-Id", requestId);
      return new NextResponse(null, { status: 204, headers: preflightHeaders });
    }

    const requiresPublicApiKey = !PUBLIC_API_ANON_PATHS.has(pathname);

    if (!authHeader && apiKey) {
      requestHeaders.set("authorization", `Bearer ${apiKey}`);
      response = NextResponse.next({ request: { headers: requestHeaders } });
      response.headers.delete("Content-Type");
      applySecurityHeaders(response, pathname);
      applyApiHeaders(response, origin);
    }

    if (requiresPublicApiKey) {
      if (authHeader && !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Missing or invalid Authorization header" },
          { status: 401, headers: response.headers }
        );
      }

      // Reject empty Bearer tokens (e.g. "Bearer " with no key)
      if (authHeader?.startsWith("Bearer ") && authHeader.slice(7).trim() === "") {
        return NextResponse.json(
          { error: "Missing API key in Authorization header" },
          { status: 401, headers: response.headers }
        );
      }

      if (!authHeader && !apiKey && !hasSessionCookies) {
        return NextResponse.json(
          { error: "Missing authentication" },
          { status: 401, headers: response.headers }
        );
      }
    }

  }

  // --- CSRF protection for browser-facing auth API routes ---
  if (
    pathname.startsWith("/api/auth/") &&
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    req.method !== "OPTIONS"
  ) {
    if (!hasValidCsrfOrigin(req)) {
      return NextResponse.json(
        { error: "CSRF: invalid origin" },
        { status: 403, headers: response.headers }
      );
    }
  }

  // --- Admin page protection: require admin_session cookie ---
  if (shouldVerifyAdminSession(pathname)) {
    const hasValidAdminToken = adminSessionToken
      ? await verifyAdminSessionToken(adminSessionToken)
      : false;

    if (!hasValidAdminToken) {
      const target = new URL("/login", req.url);
      const redirect = NextResponse.redirect(target);
      applySecurityHeaders(redirect, target.pathname);
      redirect.headers.set("X-Request-Id", requestId);
      redirect.cookies.delete(ADMIN_SESSION_COOKIE_NAME);
      return redirect;
    }
  }

  const requiresSessionVerification = shouldVerifySession(pathname, hasApiKeyAuth);
  if (requiresSessionVerification && !PUBLIC_SESSION_PAGES.has(pathname)) {
    if (!hasSessionCookies) {
      return unauthorizedResponse(req, response, pathname);
    }

    const hasValidAccessToken = accessToken
      ? await verifySessionJwt(accessToken, "access")
      : null;

    if (!hasValidAccessToken) {
      const hasValidRefreshToken = refreshToken
        ? await verifySessionJwt(refreshToken, "refresh")
        : null;

      if (!hasValidRefreshToken) {
        return unauthorizedResponse(req, response, pathname);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
