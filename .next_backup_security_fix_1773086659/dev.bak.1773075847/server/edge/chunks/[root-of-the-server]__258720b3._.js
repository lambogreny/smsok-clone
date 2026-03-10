(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__258720b3._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/lib/rate-limit.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * In-memory rate limiter for API routes
 * Limits requests per IP/API key within a sliding window
 */ __turbopack_context__.s([
    "checkRateLimit",
    ()=>checkRateLimit,
    "rateLimitResponse",
    ()=>rateLimitResponse
]);
const store = new Map();
// Cleanup stale entries every 5 minutes
setInterval(()=>{
    const now = Date.now();
    for (const [key, entry] of store){
        if (entry.resetAt < now) store.delete(key);
    }
}, 5 * 60 * 1000);
const DEFAULTS = {
    sms: {
        windowMs: 60_000,
        maxRequests: 10
    },
    batch: {
        windowMs: 60_000,
        maxRequests: 5
    },
    auth: {
        windowMs: 15 * 60_000,
        maxRequests: 10
    },
    api: {
        windowMs: 60_000,
        maxRequests: 60
    },
    slip: {
        windowMs: 60_000,
        maxRequests: 5
    },
    password: {
        windowMs: 15 * 60_000,
        maxRequests: 5
    },
    apikey: {
        windowMs: 60_000,
        maxRequests: 10
    },
    import: {
        windowMs: 60_000,
        maxRequests: 5
    },
    admin: {
        windowMs: 60_000,
        maxRequests: 30
    },
    otp_generate: {
        windowMs: 5 * 60_000,
        maxRequests: 3
    },
    otp_verify: {
        windowMs: 15 * 60_000,
        maxRequests: 10
    }
};
function checkRateLimit(identifier, type = "api") {
    const config = DEFAULTS[type];
    const key = `${type}:${identifier}`;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt < now) {
        store.set(key, {
            count: 1,
            resetAt: now + config.windowMs
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs
        };
    }
    entry.count++;
    if (entry.count > config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: entry.resetAt - now
        };
    }
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetAt - now
    };
}
function rateLimitResponse(resetIn) {
    return Response.json({
        error: "Too many requests. Please try again later."
    }, {
        status: 429,
        headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Reset": String(Math.ceil(resetIn / 1000))
        }
    });
}
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/rate-limit.ts [middleware-edge] (ecmascript)");
;
;
const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000"
].filter(Boolean);
const PUBLIC_API_ANON_PATHS = new Set([
    "/api/v1/docs",
    "/api/v1/packages"
]);
function applySecurityHeaders(response) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
}
function applyApiHeaders(response, origin) {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Vary", "Origin, Authorization, X-API-Key");
}
function middleware(req) {
    const { pathname } = req.nextUrl;
    const requestHeaders = new Headers(req.headers);
    let response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
        request: {
            headers: requestHeaders
        }
    });
    applySecurityHeaders(response);
    // --- CORS for API routes ---
    if (pathname.startsWith("/api/v1/")) {
        const origin = req.headers.get("origin");
        applyApiHeaders(response, origin);
        // Preflight
        if (req.method === "OPTIONS") {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"](null, {
                status: 204,
                headers: response.headers
            });
        }
        const authHeader = req.headers.get("authorization");
        const apiKey = req.headers.get("x-api-key")?.trim();
        const requiresPublicApiKey = !PUBLIC_API_ANON_PATHS.has(pathname);
        if (!authHeader && apiKey) {
            requestHeaders.set("authorization", `Bearer ${apiKey}`);
            response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next({
                request: {
                    headers: requestHeaders
                }
            });
            applySecurityHeaders(response);
            applyApiHeaders(response, origin);
        }
        if (requiresPublicApiKey) {
            if (authHeader && !authHeader.startsWith("Bearer ")) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Missing or invalid Authorization header"
                }, {
                    status: 401,
                    headers: response.headers
                });
            }
            if (!authHeader && !apiKey) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Missing API key"
                }, {
                    status: 401,
                    headers: response.headers
                });
            }
        }
        // Rate limit write operations only (GET/HEAD pass freely)
        if (req.method !== "GET" && req.method !== "HEAD") {
            const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
            const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["checkRateLimit"])(ip, "api");
            if (!result.allowed) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["rateLimitResponse"])(result.resetIn);
            }
            response.headers.set("X-RateLimit-Limit", "60");
            response.headers.set("X-RateLimit-Remaining", String(result.remaining));
        }
    }
    // --- Auth rate limiting for login/register pages ---
    if (pathname === "/login" || pathname === "/register") {
        if (req.method === "POST") {
            const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
            const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["checkRateLimit"])(ip, "auth");
            if (!result.allowed) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$rate$2d$limit$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["rateLimitResponse"])(result.resetIn);
            }
        }
    }
    return response;
}
const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__258720b3._.js.map