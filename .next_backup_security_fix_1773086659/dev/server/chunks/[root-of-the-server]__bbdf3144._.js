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
"[project]/app/api/v1/credits/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-auth.ts [app-route] (ecmascript)");
;
async function GET(req) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authenticateApiKey"])(req);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiResponse"])({
            credits: user.credits,
            userId: user.id
        });
    } catch (error) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiError"])(error);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bbdf3144._.js.map