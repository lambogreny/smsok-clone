import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
].filter(Boolean);
const PUBLIC_API_ANON_PATHS = new Set([
  "/api/v1/docs",
  "/api/v1/packages",
]);

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
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
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  applySecurityHeaders(response);

  // --- CORS for API routes ---
  if (pathname.startsWith("/api/v1/")) {
    const origin = req.headers.get("origin");
    applyApiHeaders(response, origin);

    // Preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    const authHeader = req.headers.get("authorization");
    const apiKey = req.headers.get("x-api-key")?.trim();
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

      const result = checkRateLimit(ip, "api");
      if (!result.allowed) {
        return rateLimitResponse(result.resetIn);
      }

      response.headers.set("X-RateLimit-Limit", "60");
      response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    }
  }

  // --- Auth rate limiting for login/register pages ---
  if (pathname === "/login" || pathname === "/register") {
    if (req.method === "POST") {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || req.headers.get("x-real-ip")
        || "unknown";

      const result = checkRateLimit(ip, "auth");
      if (!result.allowed) {
        return rateLimitResponse(result.resetIn);
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
