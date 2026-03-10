module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/logger.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logger",
    ()=>logger
]);
function log(level, msg, meta) {
    const entry = {
        level,
        msg,
        timestamp: new Date().toISOString(),
        ...meta
    };
    const output = JSON.stringify(entry);
    if (level === "error") {
        console.error(output);
    } else if (level === "warn") {
        console.warn(output);
    } else {
        console.log(output);
    }
}
const logger = {
    info: (msg, meta)=>log("info", msg, meta),
    warn: (msg, meta)=>log("warn", msg, meta),
    error: (msg, meta)=>log("error", msg, meta),
    debug: (msg, meta)=>{
        if ("TURBOPACK compile-time truthy", 1) log("debug", msg, meta);
    }
};
}),
"[project]/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/logger.ts [app-route] (ecmascript)");
;
;
const globalForPrisma = globalThis;
if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
        log: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : [
            {
                emit: "event",
                level: "error"
            }
        ]
    });
    globalForPrisma.prisma.$on("error", (e)=>{
        const event = e;
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logger"].error("Prisma error", {
            detail: event.message
        });
    });
}
const prisma = globalForPrisma.prisma;
}),
"[project]/lib/api-auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApiError",
    ()=>ApiError,
    "apiError",
    ()=>apiError,
    "apiResponse",
    ()=>apiResponse,
    "authenticateApiKey",
    ()=>authenticateApiKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
;
async function authenticateApiKey(req) {
    const authHeader = req.headers.get("authorization");
    const headerApiKey = req.headers.get("x-api-key")?.trim();
    if (authHeader && !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Missing or invalid Authorization header");
    }
    const key = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : headerApiKey;
    if (!key) {
        throw new ApiError(401, "Missing or invalid Authorization header");
    }
    const apiKey = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].apiKey.findUnique({
        where: {
            key
        },
        select: {
            id: true,
            isActive: true,
            userId: true,
            user: {
                select: {
                    id: true,
                    credits: true,
                    role: true
                }
            }
        }
    });
    if (!apiKey) {
        throw new ApiError(401, "Invalid API key");
    }
    if (!apiKey.isActive) {
        throw new ApiError(401, "API key is disabled");
    }
    // Update lastUsed (fire and forget)
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].apiKey.update({
        where: {
            id: apiKey.id
        },
        data: {
            lastUsed: new Date()
        }
    }).catch(()=>{});
    return apiKey.user;
}
class ApiError extends Error {
    status;
    constructor(status, message){
        super(message), this.status = status;
    }
}
function apiResponse(data, status = 200) {
    return Response.json(data, {
        status
    });
}
function apiError(error) {
    if (error instanceof ApiError) {
        return Response.json({
            error: error.message
        }, {
            status: error.status
        });
    }
    if (error instanceof Error) {
        const zodIssues = error.name === "ZodError" && "issues" in error && Array.isArray(error.issues) ? error.issues : null;
        // Known validation/business logic errors → 400, expose message
        const msg = zodIssues?.[0]?.message || error.message;
        const isValidation = msg.includes("ไม่ถูกต้อง") || msg.includes("ไม่พบ") || msg.includes("ไม่เพียงพอ") || msg.includes("มากเกินไป") || msg.includes("สูงสุด") || msg.includes("หมดอายุ") || msg.includes("ยังไม่ได้") || msg.includes("กรุณา") || msg.includes("ไม่สำเร็จ") || msg.includes("ใช้งานแล้ว") || msg.includes("ถูกล็อค") || msg.includes("หากเบอร์") || error.name === "ZodError";
        // For unexpected server errors (5xx), never expose raw message — may leak internals
        return Response.json({
            error: isValidation ? msg : "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่"
        }, {
            status: isValidation ? 400 : 500
        });
    }
    return Response.json({
        error: "Internal server error"
    }, {
        status: 500
    });
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/env.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "env",
    ()=>env,
    "getEnv",
    ()=>getEnv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
;
const WEAK_SECRETS = [
    "smsok-dev-secret-change-in-production",
    "smsok-local-dev-secret-32chars-min",
    "secret",
    "jwt-secret",
    "change-me"
];
const envSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    DATABASE_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(16, "JWT_SECRET must be at least 16 characters").refine((s)=>("TURBOPACK compile-time value", "development") !== "production" || s.length >= 32, "JWT_SECRET must be at least 32 characters in production").refine((s)=>("TURBOPACK compile-time value", "development") !== "production" || !WEAK_SECRETS.includes(s), "JWT_SECRET is too weak for production — use: openssl rand -hex 32"),
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "development",
        "production",
        "test"
    ]).default("development"),
    PORT: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().default(3000),
    REDIS_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    EASYTHUNDER_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    EASYTHUNDER_API_SECRET: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    EASYSLIP_API_KEY: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    COMMIT_SHA: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default("dev")
});
let _env = null;
function getEnv() {
    if (_env) return _env;
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
        const errors = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].prettifyError(result.error);
        console.error("❌ Environment validation failed:");
        console.error(errors);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // In dev or during build, return raw env to avoid crashing
        return process.env;
    }
    _env = result.data;
    return _env;
}
const env = new Proxy({}, {
    get (_, prop) {
        return getEnv()[prop];
    }
});
}),
"[project]/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearSession",
    ()=>clearSession,
    "getSession",
    ()=>getSession,
    "hashPassword",
    ()=>hashPassword,
    "setSession",
    ()=>setSession,
    "signToken",
    ()=>signToken,
    "verifyPassword",
    ()=>verifyPassword,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/env.ts [app-route] (ecmascript)");
;
;
;
;
;
const JWT_SECRET = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["env"].JWT_SECRET;
async function hashPassword(password) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(password, 12);
}
async function verifyPassword(password, hash) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(password, hash);
}
function signToken(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign({
        userId
    }, JWT_SECRET, {
        expiresIn: "7d"
    });
}
function verifyToken(token) {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
    } catch  {
        return null;
    }
}
async function getSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: payload.userId
        },
        select: {
            id: true,
            name: true,
            email: true,
            credits: true,
            role: true
        }
    });
    return user;
}
async function setSession(userId) {
    const token = signToken(userId);
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/"
    });
}
async function clearSession() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete("session");
}
}),
"[project]/lib/sms-gateway.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getJobStatus",
    ()=>getJobStatus,
    "sendSingleSms",
    ()=>sendSingleSms,
    "sendSmsBatch",
    ()=>sendSmsBatch
]);
/**
 * EasyThunder SMS Gateway — DTAC Corporate Gateway
 * Base URL: https://sms-api.cl1.easythunder.com
 *
 * Flow: POST /auth/login → Bearer JWT → POST /sms/send
 * Max 1000 numbers per request, sender max 11 chars
 * msgType: E=English, T=Thai, H=Hex(Unicode)
 */ const SMS_API_URL = process.env.SMS_API_URL || "https://sms-api.cl1.easythunder.com";
const SMS_API_USERNAME = process.env.SMS_API_USERNAME || "";
const SMS_API_PASSWORD = process.env.SMS_API_PASSWORD || "";
let cachedToken = null;
// ==========================================
// Auth — Login to get JWT token
// ==========================================
async function login() {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
        return cachedToken;
    }
    const res = await fetch(`${SMS_API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: SMS_API_USERNAME,
            password: SMS_API_PASSWORD
        })
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`SMS Gateway login failed: ${res.status} ${body}`);
    }
    const json = await res.json();
    const { accessToken, refreshToken, expiresIn } = json.data;
    cachedToken = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (expiresIn || 3600) * 1000 - 60_000
    };
    return {
        accessToken,
        refreshToken
    };
}
// ==========================================
// Refresh token
// ==========================================
async function refreshToken() {
    if (!cachedToken?.refreshToken) {
        const { accessToken } = await login();
        return accessToken;
    }
    const res = await fetch(`${SMS_API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            refreshToken: cachedToken.refreshToken
        })
    });
    if (!res.ok) {
        // Refresh failed — do full login
        cachedToken = null;
        const { accessToken } = await login();
        return accessToken;
    }
    const json = await res.json();
    cachedToken = {
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken || cachedToken.refreshToken,
        expiresAt: Date.now() + (json.data.expiresIn || 3600) * 1000 - 60_000
    };
    return json.data.accessToken;
}
// ==========================================
// Get valid access token (auto-login/refresh)
// ==========================================
async function getToken() {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
        return cachedToken.accessToken;
    }
    const { accessToken } = await login();
    return accessToken;
}
// ==========================================
// Detect message type
// ==========================================
function detectMsgType(message) {
    const hasThai = /[\u0E00-\u0E7F]/.test(message);
    if (hasThai) return "T";
    // Check for any non-ASCII (Unicode) characters
    const hasUnicode = /[^\x00-\x7F]/.test(message);
    if (hasUnicode) return "H";
    return "E";
}
// ==========================================
// Format phone for API (66XXXXXXXXX)
// ==========================================
function formatPhoneForApi(phone) {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
        return "66" + cleaned.slice(1);
    }
    if (cleaned.startsWith("+66")) {
        return cleaned.slice(1);
    }
    if (cleaned.startsWith("66")) {
        return cleaned;
    }
    return cleaned;
}
async function sendSmsBatch(params) {
    const { recipients, message, sender } = params;
    if (recipients.length === 0) {
        return {
            success: false,
            error: "No recipients"
        };
    }
    if (recipients.length > 1000) {
        return {
            success: false,
            error: "Max 1000 recipients per request"
        };
    }
    if (sender.length > 11) {
        return {
            success: false,
            error: "Sender name max 11 characters"
        };
    }
    const token = await getToken();
    const msgType = detectMsgType(message);
    const msnList = recipients.map(formatPhoneForApi);
    const res = await fetch(`${SMS_API_URL}/sms/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            msnList,
            message,
            sender,
            msgType
        })
    });
    if (res.status === 401) {
        // Token expired — refresh and retry once
        const newToken = await refreshToken();
        const retryRes = await fetch(`${SMS_API_URL}/sms/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`
            },
            body: JSON.stringify({
                msnList,
                message,
                sender,
                msgType
            })
        });
        if (!retryRes.ok) {
            const body = await retryRes.text();
            return {
                success: false,
                error: `SMS send failed after retry: ${retryRes.status} ${body}`
            };
        }
        const retryJson = await retryRes.json();
        return {
            success: true,
            jobId: retryJson.data?.jobId,
            totalSent: msnList.length
        };
    }
    if (!res.ok) {
        const body = await res.text();
        return {
            success: false,
            error: `SMS send failed: ${res.status} ${body}`
        };
    }
    const json = await res.json();
    return {
        success: true,
        jobId: json.data?.jobId,
        totalSent: msnList.length
    };
}
async function sendSingleSms(recipient, message, sender) {
    return sendSmsBatch({
        recipients: [
            recipient
        ],
        message,
        sender
    });
}
async function getJobStatus(jobId) {
    const token = await getToken();
    const res = await fetch(`${SMS_API_URL}/sms/jobs/${jobId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to get job status: ${res.status} ${body}`);
    }
    const json = await res.json();
    return json.data;
}
}),
"[project]/lib/validations.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addContactsToGroupSchema",
    ()=>addContactsToGroupSchema,
    "addGroupMembersSchema",
    ()=>addGroupMembersSchema,
    "amountSchema",
    ()=>amountSchema,
    "approveSenderNameSchema",
    ()=>approveSenderNameSchema,
    "assignContactTagSchema",
    ()=>assignContactTagSchema,
    "calculateCreditCost",
    ()=>calculateCreditCost,
    "calculateSmsCount",
    ()=>calculateSmsCount,
    "changePasswordSchema",
    ()=>changePasswordSchema,
    "contactFilterSchema",
    ()=>contactFilterSchema,
    "contactsImportSchema",
    ()=>contactsImportSchema,
    "createApiKeySchema",
    ()=>createApiKeySchema,
    "createCampaignSchema",
    ()=>createCampaignSchema,
    "createContactGroupSchema",
    ()=>createContactGroupSchema,
    "createContactSchema",
    ()=>createContactSchema,
    "createTagSchema",
    ()=>createTagSchema,
    "creditHistoryQuerySchema",
    ()=>creditHistoryQuerySchema,
    "dateRangeSchema",
    ()=>dateRangeSchema,
    "emailSchema",
    ()=>emailSchema,
    "forgotPasswordSchema",
    ()=>forgotPasswordSchema,
    "idSchema",
    ()=>idSchema,
    "loginSchema",
    ()=>loginSchema,
    "normalizePhone",
    ()=>normalizePhone,
    "optionalEmailSchema",
    ()=>optionalEmailSchema,
    "optionalPhoneSchema",
    ()=>optionalPhoneSchema,
    "paginationSchema",
    ()=>paginationSchema,
    "phoneSchema",
    ()=>phoneSchema,
    "purchasePackageSchema",
    ()=>purchasePackageSchema,
    "registerSchema",
    ()=>registerSchema,
    "reportFilterSchema",
    ()=>reportFilterSchema,
    "requestSenderNameSchema",
    ()=>requestSenderNameSchema,
    "resetPasswordSchema",
    ()=>resetPasswordSchema,
    "scheduledSmsCancelSchema",
    ()=>scheduledSmsCancelSchema,
    "scheduledSmsCreateSchema",
    ()=>scheduledSmsCreateSchema,
    "sendBatchSmsApiSchema",
    ()=>sendBatchSmsApiSchema,
    "sendBatchSmsSchema",
    ()=>sendBatchSmsSchema,
    "sendOtpSchema",
    ()=>sendOtpSchema,
    "sendSmsApiSchema",
    ()=>sendSmsApiSchema,
    "sendSmsSchema",
    ()=>sendSmsSchema,
    "templateRenderSchema",
    ()=>templateRenderSchema,
    "templateSchema",
    ()=>templateSchema,
    "updateContactSchema",
    ()=>updateContactSchema,
    "updateProfileSchema",
    ()=>updateProfileSchema,
    "updateTagSchema",
    ()=>updateTagSchema,
    "uploadSlipSchema",
    ()=>uploadSlipSchema,
    "verifyOtpSchema",
    ()=>verifyOtpSchema,
    "verifyTopupSlipSchema",
    ()=>verifyTopupSlipSchema,
    "verifyTransactionSchema",
    ()=>verifyTransactionSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
;
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const HTML_TAG_REGEX = /<[^>]*>/g;
const INVALID_NAME_CHAR_REGEX = /[<>&"']/;
const SANITIZED_PHONE_REGEX = /^(0[0-9]{9}|\+66[0-9]{9})$/;
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
function sanitizePhoneInput(value) {
    return value.replace(/[^0-9+]/g, "");
}
function sanitizeEmailInput(value) {
    return value.toLowerCase().trim();
}
function sanitizeTextInput(value) {
    return value.replace(CONTROL_CHAR_REGEX, "").trim();
}
function sanitizeNameInput(value) {
    return value.replace(HTML_TAG_REGEX, "").trim();
}
function isValidEmail(value) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง").safeParse(value).success;
}
function parseSlipPayloadInput(input) {
    const trimmedPayload = input.payload.trim();
    const dataUrlMatch = trimmedPayload.match(/^data:(image\/(?:jpeg|png));base64,([\s\S]+)$/i);
    if (dataUrlMatch) {
        return {
            mimeType: dataUrlMatch[1].toLowerCase(),
            payload: dataUrlMatch[2].replace(/\s+/g, "")
        };
    }
    return {
        mimeType: input.mimeType?.trim().toLowerCase(),
        payload: trimmedPayload.replace(/\s+/g, "")
    };
}
function estimateBase64Bytes(base64) {
    const padding = base64.match(/=*$/)?.[0].length ?? 0;
    return Math.floor(base64.length * 3 / 4) - padding;
}
const phoneSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizePhoneInput).refine((value)=>SANITIZED_PHONE_REGEX.test(value), "เบอร์โทรไม่ถูกต้อง");
const optionalPhoneSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
]).transform((value)=>{
    if (typeof value !== "string") return undefined;
    const sanitized = sanitizePhoneInput(value);
    return sanitized === "" ? undefined : sanitized;
}).refine((value)=>value === undefined || SANITIZED_PHONE_REGEX.test(value), "เบอร์โทรไม่ถูกต้อง");
const emailSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeEmailInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง"));
const optionalEmailSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
]).transform((value)=>{
    if (typeof value !== "string") return value;
    const sanitized = sanitizeEmailInput(value);
    return sanitized;
}).refine((value)=>value === undefined || value === "" || isValidEmail(value), "อีเมลไม่ถูกต้อง");
const amountSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0, "จำนวนเงินต้องไม่ติดลบ");
function messageSchema(min, max, requiredMessage, maxMessage) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeTextInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(min, requiredMessage).max(max, maxMessage));
}
function sanitizedNameSchema(min, max, requiredMessage, maxMessage) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeNameInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(min, requiredMessage).max(max, maxMessage)).refine((value)=>!INVALID_NAME_CHAR_REGEX.test(value), "ชื่อมีอักขระไม่อนุญาต");
}
function sanitizedOptionalTextSchema(max, maxMessage) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
    ]).transform((value)=>{
        if (typeof value !== "string") return value;
        return sanitizeTextInput(value);
    }).refine((value)=>value === undefined || value.length <= max, maxMessage);
}
const registerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(2, 100, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร", "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100).regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว").regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว")
});
const loginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: emailSchema,
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกรหัสผ่าน")
});
const strongPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100).regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว").regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว");
const forgotPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    phone: phoneSchema
});
const resetPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    token: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(12, "โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง").max(128, "โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง"),
    newPassword: strongPasswordSchema
});
const changePasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    currentPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    newPassword: strongPasswordSchema,
    confirmPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
}).refine((data)=>data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: [
        "confirmPassword"
    ]
});
const updateProfileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(2, 100, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร", "ชื่อต้องไม่เกิน 100 ตัวอักษร")
});
const sendSmsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9 ]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น"),
    recipient: phoneSchema,
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendBatchSmsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(11).regex(/^[A-Za-z0-9 ]+$/),
    recipients: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(phoneSchema).min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์").max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendSmsApiSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().default("EasySlip"),
    to: phoneSchema,
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendBatchSmsApiSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().default("EasySlip"),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(phoneSchema).min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์").max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendOtpSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    phone: phoneSchema,
    purpose: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "verify",
        "login",
        "transaction"
    ]).default("verify")
});
const verifyOtpSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ref: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(6, "ref ไม่ถูกต้อง").max(32, "ref ไม่ถูกต้อง").regex(/^[A-Za-z0-9]+$/, "ref ไม่ถูกต้อง").transform((value)=>value.toUpperCase()),
    code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{6}$/, "รหัส OTP ไม่ถูกต้อง")
});
const createContactSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อ", "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
    phone: phoneSchema,
    email: optionalEmailSchema,
    tags: sanitizedOptionalTextSchema(500, "tags ต้องไม่เกิน 500 ตัวอักษร")
});
const updateContactSchema = createContactSchema.partial();
const createContactGroupSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อกลุ่ม", "ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร")
});
const addGroupMembersSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    contactIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()).min(1)
});
const addContactsToGroupSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    groupId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    contactIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()).min(1, "กรุณาเลือกรายชื่ออย่างน้อย 1 รายชื่อ")
});
const contactFilterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20),
    tagId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional()
});
const hexColorSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^#[0-9A-Fa-f]{6}$/, "สีต้องเป็นรหัส HEX เช่น #94A3B8");
const createTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อแท็ก", "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร"),
    color: hexColorSchema.default("#94A3B8")
});
const updateTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อแท็ก", "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร").optional(),
    color: hexColorSchema.optional()
}).refine((data)=>data.name !== undefined || data.color !== undefined, {
    message: "กรุณาระบุข้อมูลที่ต้องการแก้ไข"
});
const assignContactTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tagId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()
});
const requestSenderNameSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeNameInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9 ]+$/, "ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น")).refine((value)=>!INVALID_NAME_CHAR_REGEX.test(value), "ชื่อมีอักขระไม่อนุญาต").transform((value)=>value.toUpperCase())
});
const approveSenderNameSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "approve",
        "reject"
    ]),
    rejectNote: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional()
});
const purchasePackageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    packageId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณาเลือกแพ็กเกจ"),
    method: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "bank_transfer",
        "promptpay"
    ])
});
const uploadSlipSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    transactionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    slipUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url("URL สลิปไม่ถูกต้อง")
});
const verifyTopupSlipSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    payload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "กรุณาแนบสลิปแบบ base64"),
    mimeType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().optional()
}).superRefine((value, ctx)=>{
    const parsed = parseSlipPayloadInput(value);
    if (!parsed.mimeType || ![
        "image/jpeg",
        "image/png"
    ].includes(parsed.mimeType)) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: "ไฟล์สลิปต้องเป็น JPEG หรือ PNG เท่านั้น",
            path: [
                "payload"
            ]
        });
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(parsed.payload)) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: "ไฟล์สลิป base64 ไม่ถูกต้อง",
            path: [
                "payload"
            ]
        });
    }
    if (estimateBase64Bytes(parsed.payload) > MAX_SLIP_BYTES) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: "ไฟล์สลิปต้องมีขนาดไม่เกิน 5MB",
            path: [
                "payload"
            ]
        });
    }
}).transform((value)=>parseSlipPayloadInput(value));
const verifyTransactionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    transactionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "verify",
        "reject"
    ]),
    rejectNote: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional()
});
const scheduledSmsCreateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().default("EasySlip"),
    to: phoneSchema,
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
    scheduledAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "กรุณาระบุเวลาที่ต้องการส่ง")
});
const scheduledSmsCancelSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("cancel"),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()
});
const createApiKeySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณาตั้งชื่อ API Key", "ชื่อ API Key ต้องไม่เกิน 100 ตัวอักษร")
});
const createCampaignSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อแคมเปญ", "ชื่อแคมเปญต้องไม่เกิน 100 ตัวอักษร"),
    contactGroupId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9 ]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น").optional(),
    scheduledAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional()
});
const templateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณาตั้งชื่อเทมเพลต", "ชื่อเทมเพลตต้องไม่เกิน 100 ตัวอักษร"),
    content: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
    category: sanitizedNameSchema(1, 50, "กรุณาระบุหมวดหมู่", "หมวดหมู่ต้องไม่เกิน 50 ตัวอักษร").default("general")
});
const contactsImportSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    contacts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(createContactSchema).min(1, "ไม่มีรายชื่อที่จะนำเข้า").max(10000, "นำเข้าได้สูงสุด 10,000 รายชื่อต่อครั้ง")
});
const templateRenderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    content: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร").optional(),
    variables: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
}).refine((value)=>Boolean(value.templateId) || Boolean(value.content), {
    message: "Provide templateId or content"
});
const dateInputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
]).transform((value)=>{
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
}).refine((value)=>value === undefined || !Number.isNaN(new Date(value).getTime()), "วันที่ไม่ถูกต้อง");
const creditHistoryQuerySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    from: dateInputSchema,
    to: dateInputSchema,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "TOPUP",
        "SMS_SEND",
        "REFUND"
    ]).optional(),
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20)
});
const idSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()
});
const paginationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20)
});
const dateRangeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    from: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional()
});
const reportFilterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "pending",
        "sent",
        "delivered",
        "failed"
    ]).optional(),
    senderName: sanitizedOptionalTextSchema(50, "senderName ต้องไม่เกิน 50 ตัวอักษร"),
    search: sanitizedOptionalTextSchema(100, "คำค้นหาต้องไม่เกิน 100 ตัวอักษร"),
    from: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional()
});
function calculateSmsCount(message) {
    const hasThai = /[\u0E00-\u0E7F]/.test(message);
    const maxPerSms = hasThai ? 70 : 160;
    return Math.ceil(message.length / maxPerSms);
}
function calculateCreditCost(message) {
    return calculateSmsCount(message);
}
function normalizePhone(phone) {
    const sanitized = sanitizePhoneInput(phone);
    if (sanitized.startsWith("+66")) {
        return sanitized;
    }
    const cleaned = sanitized.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
        return "+66" + cleaned.slice(1);
    }
    if (cleaned.startsWith("66")) {
        return "+" + cleaned;
    }
    return "+" + cleaned;
}
;
}),
"[project]/lib/actions/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4046e5ccd84d90585a394f3ded5bfa55b92a5f4486":"forgotPassword","40e6138324e767e21cd197fe67f4fd4fd2b8eac82c":"resetPassword"},"",""] */ __turbopack_context__.s([
    "forgotPassword",
    ()=>forgotPassword,
    "resetPassword",
    ()=>resetPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/sms-gateway.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
;
;
;
;
const RESET_TOKEN_EXPIRY_MS = 5 * 60 * 1000;
const RESET_RATE_WINDOW_MS = 5 * 60 * 1000;
const MAX_RESET_PER_PHONE_PER_WINDOW = 3;
const MAX_RESET_ATTEMPTS = 5;
const RESET_PURPOSE = "password_reset";
function alternatePhone(phone) {
    if (phone.startsWith("+66")) {
        return `0${phone.slice(3)}`;
    }
    if (phone.startsWith("0")) {
        return `+66${phone.slice(1)}`;
    }
    return phone;
}
function getResetTokenSecret() {
    const secret = process.env.OTP_HASH_SECRET?.trim() || process.env.JWT_SECRET?.trim();
    if (!secret) {
        throw new Error("OTP_HASH_SECRET is not configured");
    }
    return secret;
}
function generateResetRefCode() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(4).toString("hex").toUpperCase();
}
function generateResetSecret() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomInt(100000, 999999).toString();
}
function buildResetToken(refCode, secret) {
    return `${refCode}-${secret}`;
}
function parseResetToken(token) {
    const normalized = token.trim().toUpperCase();
    const [refCode, secret] = normalized.split("-");
    if (!refCode || !secret || !/^[A-F0-9]{8}$/.test(refCode) || !/^\d{6}$/.test(secret)) {
        throw new Error("โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง");
    }
    return {
        refCode,
        secret
    };
}
function hashResetToken(secret, refCode) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHmac("sha256", getResetTokenSecret()).update(`${refCode}:${secret}`).digest("hex");
}
function timingSafeMatch(left, right) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(a, b);
}
function hasSmsGatewayCredentials() {
    return Boolean(process.env.SMS_API_USERNAME?.trim() && process.env.SMS_API_PASSWORD?.trim());
}
async function forgotPassword(input) {
    const { phone } = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forgotPasswordSchema"].parse(input);
    const fallbackPhone = alternatePhone(phone);
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
        where: {
            OR: [
                {
                    phone
                },
                {
                    phone: fallbackPhone
                }
            ]
        },
        select: {
            id: true,
            phone: true
        }
    });
    if (!user) {
        // Generic message to prevent user enumeration
        throw new Error("หากเบอร์นี้ลงทะเบียนไว้ จะได้รับรหัสรีเซ็ตรหัสผ่านทาง SMS");
    }
    const windowStart = new Date(Date.now() - RESET_RATE_WINDOW_MS);
    const recentCount = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].otpRequest.count({
        where: {
            phone: user.phone,
            purpose: RESET_PURPOSE,
            createdAt: {
                gte: windowStart
            }
        }
    });
    if (recentCount >= MAX_RESET_PER_PHONE_PER_WINDOW) {
        throw new Error("ส่งรหัสรีเซ็ตรหัสผ่านมากเกินไป กรุณารอ 5 นาที");
    }
    const refCode = generateResetRefCode();
    const secret = generateResetSecret();
    const resetToken = buildResetToken(refCode, secret);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    const record = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].otpRequest.create({
        data: {
            userId: user.id,
            phone: user.phone,
            refCode,
            code: hashResetToken(secret, refCode),
            purpose: RESET_PURPOSE,
            expiresAt
        },
        select: {
            id: true
        }
    });
    const message = `รหัสรีเซ็ตรหัสผ่านของคุณคือ ${resetToken} (หมดอายุใน 5 นาที)`;
    const debugMode = ("TURBOPACK compile-time value", "development") !== "production" && !hasSmsGatewayCredentials();
    if (!debugMode) {
        try {
            const smsResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sendSingleSms"])(user.phone, message, "EasySlip");
            if (!smsResult.success) {
                throw new Error(smsResult.error || "ส่งรหัสรีเซ็ตรหัสผ่านไม่สำเร็จ");
            }
        } catch  {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].otpRequest.delete({
                where: {
                    id: record.id
                }
            });
            throw new Error("ส่งรหัสรีเซ็ตรหัสผ่านไม่สำเร็จ");
        }
    }
    return {
        success: true,
        expiresIn: Math.floor(RESET_TOKEN_EXPIRY_MS / 1000),
        delivery: debugMode ? "debug" : "sms",
        ...debugMode ? {
            debugToken: resetToken
        } : {}
    };
}
async function resetPassword(input) {
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resetPasswordSchema"].parse(input);
    const { refCode, secret } = parseResetToken(parsed.token);
    const record = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].otpRequest.findFirst({
        where: {
            refCode,
            purpose: RESET_PURPOSE
        },
        select: {
            id: true,
            userId: true,
            code: true,
            attempts: true,
            verified: true,
            expiresAt: true
        }
    });
    if (!record || !record.userId) {
        throw new Error("ไม่พบโทเค็นรีเซ็ตรหัสผ่าน");
    }
    if (record.verified) {
        throw new Error("โทเค็นรีเซ็ตรหัสผ่านนี้ถูกใช้งานแล้ว");
    }
    if (record.expiresAt.getTime() < Date.now()) {
        throw new Error("โทเค็นรีเซ็ตรหัสผ่านหมดอายุแล้ว");
    }
    if (record.attempts >= MAX_RESET_ATTEMPTS) {
        throw new Error("โทเค็นรีเซ็ตรหัสผ่านถูกล็อคแล้ว กรุณาขอรหัสใหม่");
    }
    const isValid = timingSafeMatch(hashResetToken(secret, refCode), record.code);
    if (!isValid) {
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
            where: {
                id: record.id
            },
            data: {
                attempts: {
                    increment: 1
                }
            },
            select: {
                attempts: true
            }
        });
        const remaining = Math.max(0, MAX_RESET_ATTEMPTS - updated.attempts);
        if (remaining === 0) {
            throw new Error("โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง และถูกล็อคแล้ว กรุณาขอรหัสใหม่");
        }
        throw new Error(`โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
    }
    const passwordHash = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hashPassword"])(parsed.newPassword);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id: record.userId
            },
            data: {
                password: passwordHash,
                mustChangePassword: false,
                phoneVerified: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
            where: {
                id: record.id
            },
            data: {
                verified: true
            }
        })
    ]);
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    forgotPassword,
    resetPassword
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(forgotPassword, "4046e5ccd84d90585a394f3ded5bfa55b92a5f4486", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(resetPassword, "40e6138324e767e21cd197fe67f4fd4fd2b8eac82c", null);
}),
"[project]/app/api/auth/forgot-password/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-route] (ecmascript)");
;
;
;
async function POST(req) {
    try {
        const body = await req.json();
        const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forgotPasswordSchema"].parse(body);
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forgotPassword"])(input);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiResponse"])(result);
    } catch (error) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiError"])(error);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8a1ccfb0._.js.map