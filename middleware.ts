import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
].filter(Boolean);
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

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

function applyApiHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
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
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/v1/")) {
      return !hasApiKeyAuth && !PUBLIC_API_ANON_PATHS.has(pathname);
    }
    return true;
  }
  return false;
}

function isPageNavigation(pathname: string) {
  return !pathname.startsWith("/api/");
}

function appendSetCookieHeaders(from: Headers, to: NextResponse) {
  const maybeGetSetCookie = (from as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof maybeGetSetCookie === "function") {
    for (const value of maybeGetSetCookie.call(from)) {
      to.headers.append("set-cookie", value);
    }
    return;
  }

  const single = from.get("set-cookie");
  if (single) {
    to.headers.append("set-cookie", single);
  }
}

function unauthorizedResponse(req: NextRequest, base: NextResponse, pathname: string) {
  if (isPageNavigation(pathname)) {
    const target = new URL("/login", req.url);
    const redirect = NextResponse.redirect(target);
    applySecurityHeaders(redirect);
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

  // Forward pathname to server components (for conditional auth in layout)
  requestHeaders.set("x-pathname", pathname);

  // Generate or propagate X-Request-Id on every request
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  requestHeaders.set("x-request-id", requestId);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Attach X-Request-Id to every response
  response.headers.set("X-Request-Id", requestId);

  applySecurityHeaders(response);

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
      applySecurityHeaders(response);
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

      if (!authHeader && !apiKey) {
        return NextResponse.json(
          { error: "Missing API key" },
          { status: 401, headers: response.headers }
        );
      }
    }

    // Rate limit write operations only (GET/HEAD pass freely)
    if (req.method !== "GET" && req.method !== "HEAD") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
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
  if (pathname.startsWith("/api/auth/") && req.method === "POST") {
    const origin = req.headers.get("origin");
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        { error: "CSRF: invalid origin" },
        { status: 403, headers: response.headers }
      );
    }
  }

  // --- Auth rate limiting for login/register pages ---
  if (pathname === "/login" || pathname === "/register") {
    if (req.method === "POST") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        || "unknown";

      const result = await checkRateLimit(ip, "auth");
      if (!result.allowed) {
        return rateLimitResponse(result.resetIn);
      }
    }
  }

  const requiresSessionVerification = shouldVerifySession(pathname, hasApiKeyAuth);
  const hasSessionCookies = Boolean(req.cookies.get("session") || req.cookies.get("refresh_token"));

  if (requiresSessionVerification && !PUBLIC_SESSION_PAGES.has(pathname)) {
    if (!hasSessionCookies) {
      return unauthorizedResponse(req, response, pathname);
    }

    try {
      const verifyResponse = await fetch(new URL("/api/auth/verify-session", req.url), {
        method: "GET",
        headers: {
          cookie: req.headers.get("cookie") || "",
          "user-agent": req.headers.get("user-agent") || "",
          "x-forwarded-for": req.headers.get("x-forwarded-for") || "",
          "x-real-ip": req.headers.get("x-real-ip") || "",
          "x-request-id": requestId,
        },
        cache: "no-store",
      });

      if (!verifyResponse.ok) {
        return unauthorizedResponse(req, response, pathname);
      }

      appendSetCookieHeaders(verifyResponse.headers, response);
    } catch {
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "application/json");
      return new NextResponse(
        JSON.stringify({ error: "Session verification unavailable" }),
        { status: 503, headers },
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
