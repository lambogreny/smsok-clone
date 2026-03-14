import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, verifySessionJwt } from "@/lib/session-jwt";
import { getAllowedOrigins, hasValidCsrfOrigin } from "@/lib/csrf";
const PUBLIC_API_ANON_PATHS = new Set([
  "/api/v1/docs",
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

function buildContentSecurityPolicy(pathname: string) {
  const scriptSrc = process.env.NODE_ENV === "production"
    ? ["'self'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
  const styleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];
  const connectSrc = ["'self'", "https://*.ingest.sentry.io"];

  if (pathname.startsWith("/api/v1/docs")) {
    scriptSrc.push("https://cdn.jsdelivr.net");
    styleSrc.push("https://cdn.jsdelivr.net");
  }

  if (process.env.NODE_ENV !== "production") {
    connectSrc.push("ws:", "http://localhost:*", "https://localhost:*");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-ancestors 'none'",
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, pathname: string) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(pathname),
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

function applyApiHeaders(response: NextResponse, origin: string | null) {
  if (origin && getAllowedOrigins().includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin, Authorization, X-API-Key");
  response.headers.set("Access-Control-Expose-Headers", "X-Request-Id, X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After");
}

function shouldVerifySession(pathname: string, hasApiKeyAuth: boolean) {
  if (pathname.startsWith("/api/auth/")) return false;
  if (pathname.startsWith("/api/health")) return false;
  if (pathname.startsWith("/api/storage/")) return false;
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
  const hasSessionCookies = Boolean(accessToken || refreshToken);

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

    // Rate limit write operations only (GET/HEAD pass freely)
    if (req.method !== "GET" && req.method !== "HEAD") {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const ip = forwardedFor
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .at(-1)
        || req.headers.get("x-real-ip")
        || req.headers.get("cf-connecting-ip")
        || req.headers.get("fly-client-ip")
        || req.headers.get("true-client-ip")
        || "unknown";

      const result = await checkRateLimit(ip, "api");
      if (!result.allowed) {
        return rateLimitResponse(result.resetIn);
      }

      response.headers.set("X-RateLimit-Limit", "60");
      response.headers.set("X-RateLimit-Remaining", String(result.remaining));
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

  // --- Auth rate limiting for login/register pages ---
  if (pathname === "/login" || pathname === "/register") {
    if (req.method === "POST") {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const ip = forwardedFor
        ?.split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .at(-1)
        || req.headers.get("x-real-ip")
        || req.headers.get("cf-connecting-ip")
        || req.headers.get("fly-client-ip")
        || req.headers.get("true-client-ip")
        || "unknown";

      const result = await checkRateLimit(ip, "auth");
      if (!result.allowed) {
        return rateLimitResponse(result.resetIn);
      }
    }
  }

  // --- Admin page protection: require admin_session cookie ---
  if (shouldVerifyAdminSession(pathname)) {
    const adminToken = req.cookies.get("admin_session")?.value;
    if (!adminToken) {
      const target = new URL("/login", req.url);
      const redirect = NextResponse.redirect(target);
      applySecurityHeaders(redirect, target.pathname);
      redirect.headers.set("X-Request-Id", requestId);
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
