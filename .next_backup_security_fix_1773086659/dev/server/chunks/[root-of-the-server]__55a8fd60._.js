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
        // Known validation/business logic errors → 400
        const msg = error.message;
        const isValidation = msg.includes("ไม่ถูกต้อง") || msg.includes("ไม่พบ") || msg.includes("ไม่เพียงพอ") || msg.includes("มากเกินไป") || msg.includes("สูงสุด") || msg.includes("หมดอายุ") || msg.includes("ยังไม่ได้") || msg.includes("กรุณา") || msg.includes("ไม่สำเร็จ") || msg.includes("ใช้งานแล้ว") || msg.includes("ถูกล็อค") || error.name === "ZodError";
        return Response.json({
            error: msg
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
"[project]/lib/validations.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addGroupMembersSchema",
    ()=>addGroupMembersSchema,
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
    "dateRangeSchema",
    ()=>dateRangeSchema,
    "idSchema",
    ()=>idSchema,
    "loginSchema",
    ()=>loginSchema,
    "normalizePhone",
    ()=>normalizePhone,
    "paginationSchema",
    ()=>paginationSchema,
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
    "sendBatchSmsSchema",
    ()=>sendBatchSmsSchema,
    "sendOtpSchema",
    ()=>sendOtpSchema,
    "sendSmsSchema",
    ()=>sendSmsSchema,
    "updateContactSchema",
    ()=>updateContactSchema,
    "updateTagSchema",
    ()=>updateTagSchema,
    "uploadSlipSchema",
    ()=>uploadSlipSchema,
    "verifyOtpSchema",
    ()=>verifyOtpSchema,
    "verifyTransactionSchema",
    ()=>verifyTransactionSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z>");
;
const registerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(100).trim(),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง").toLowerCase().trim(),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^0[689]\d{8}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0891234567)").optional(),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100).regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว").regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว")
});
const loginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง").toLowerCase().trim(),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกรหัสผ่าน")
});
const resetPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง").toLowerCase().trim()
});
const changePasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    currentPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    newPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว").regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
    confirmPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
}).refine((data)=>data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: [
        "confirmPassword"
    ]
});
// ==========================================
// SMS Validations
// ==========================================
const thaiPhoneRegex = /^0[689]\d{8}$/;
const sendSmsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น"),
    recipient: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(thaiPhoneRegex, "เบอร์โทรไม่ถูกต้อง"),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกข้อความ").max(1000, "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendBatchSmsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(11).regex(/^[A-Za-z0-9]+$/),
    recipients: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(thaiPhoneRegex, "เบอร์โทรไม่ถูกต้อง")).min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์").max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
    message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(1000)
});
const sendOtpSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(thaiPhoneRegex, "เบอร์โทรไม่ถูกต้อง"),
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
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกชื่อ").max(100).trim(),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(thaiPhoneRegex, "เบอร์โทรไม่ถูกต้อง"),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง").optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional()
});
const updateContactSchema = createContactSchema.partial();
const createContactGroupSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกชื่อกลุ่ม").max(100).trim()
});
const addGroupMembersSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    contactIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()).min(1)
});
const contactFilterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20),
    tagId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional()
});
const hexColorSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^#[0-9A-Fa-f]{6}$/, "สีต้องเป็นรหัส HEX เช่น #94A3B8");
const createTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกชื่อแท็ก").max(50, "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร").trim(),
    color: hexColorSchema.default("#94A3B8")
});
const updateTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกชื่อแท็ก").max(50, "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร").trim().optional(),
    color: hexColorSchema.optional()
}).refine((data)=>data.name !== undefined || data.color !== undefined, {
    message: "กรุณาระบุข้อมูลที่ต้องการแก้ไข"
});
const assignContactTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tagId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()
});
const requestSenderNameSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9]+$/, "ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น").transform((s)=>s.toUpperCase())
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
const verifyTransactionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    transactionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "verify",
        "reject"
    ]),
    rejectNote: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional()
});
const createApiKeySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณาตั้งชื่อ API Key").max(100).trim()
});
const createCampaignSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกชื่อแคมเปญ").max(100, "ชื่อแคมเปญต้องไม่เกิน 100 ตัวอักษร").trim(),
    contactGroupId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น").optional(),
    scheduledAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional()
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
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    search: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100).optional(),
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
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
        return "+66" + cleaned.slice(1);
    }
    if (cleaned.startsWith("66")) {
        return "+" + cleaned;
    }
    return "+" + cleaned;
}
}),
"[project]/lib/easyslip.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getQuota",
    ()=>getQuota,
    "verifySlipByBase64",
    ()=>verifySlipByBase64,
    "verifySlipByUrl",
    ()=>verifySlipByUrl
]);
/**
 * EasySlip API — Payment Slip Verification
 * Base URL: https://developer.easyslip.com/api/v1
 * Auth: Bearer token in Authorization header
 */ const EASYSLIP_API_URL = process.env.EASYSLIP_API_URL || "https://developer.easyslip.com/api/v1";
const EASYSLIP_API_KEY = process.env.EASYSLIP_API_KEY || "";
async function verifySlipByUrl(imageUrl) {
    if (!EASYSLIP_API_KEY) {
        return {
            success: false,
            error: "EasySlip API key not configured"
        };
    }
    const res = await fetch(`${EASYSLIP_API_URL}/verify`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${EASYSLIP_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            url: imageUrl
        })
    });
    if (!res.ok) {
        const body = await res.text();
        return {
            success: false,
            error: `EasySlip verify failed: ${res.status} ${body}`
        };
    }
    const data = await res.json();
    if (data.status !== 200 && data.status !== "success") {
        return {
            success: false,
            error: data.message || "Verification failed"
        };
    }
    return {
        success: true,
        data: {
            transRef: data.data?.transRef || "",
            date: data.data?.date || "",
            amount: parseFloat(data.data?.amount?.amount || "0"),
            sender: {
                name: data.data?.sender?.displayName || "",
                bank: data.data?.sender?.bank?.short || "",
                account: data.data?.sender?.account?.value || ""
            },
            receiver: {
                name: data.data?.receiver?.displayName || "",
                bank: data.data?.receiver?.bank?.short || "",
                account: data.data?.receiver?.account?.value || ""
            }
        }
    };
}
async function verifySlipByBase64(base64Image) {
    if (!EASYSLIP_API_KEY) {
        return {
            success: false,
            error: "EasySlip API key not configured"
        };
    }
    const res = await fetch(`${EASYSLIP_API_URL}/verify`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${EASYSLIP_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            payload: base64Image
        })
    });
    if (!res.ok) {
        const body = await res.text();
        return {
            success: false,
            error: `EasySlip verify failed: ${res.status} ${body}`
        };
    }
    const data = await res.json();
    if (data.status !== 200 && data.status !== "success") {
        return {
            success: false,
            error: data.message || "Verification failed"
        };
    }
    return {
        success: true,
        data: {
            transRef: data.data?.transRef || "",
            date: data.data?.date || "",
            amount: parseFloat(data.data?.amount?.amount || "0"),
            sender: {
                name: data.data?.sender?.displayName || "",
                bank: data.data?.sender?.bank?.short || "",
                account: data.data?.sender?.account?.value || ""
            },
            receiver: {
                name: data.data?.receiver?.displayName || "",
                bank: data.data?.receiver?.bank?.short || "",
                account: data.data?.receiver?.account?.value || ""
            }
        }
    };
}
async function getQuota() {
    if (!EASYSLIP_API_KEY) return null;
    const res = await fetch(`${EASYSLIP_API_URL}/me`, {
        headers: {
            Authorization: `Bearer ${EASYSLIP_API_KEY}`
        }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
        used: data.data?.quota?.used || 0,
        total: data.data?.quota?.total || 0,
        remaining: (data.data?.quota?.total || 0) - (data.data?.quota?.used || 0)
    };
}
}),
"[project]/lib/actions/payments.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"0069791c7c2dc6f794c961b65f2a4e2cb9373e5a40":"getPackages","00e0fd45ed5a0fc1d002c36bf903f7b496845802b0":"adminGetPendingTransactions","401521bf006f585c80e12e3976ba76f6101c46b7cb":"getUserTransactions","40651319715e6504016696451b59c33f5f5ca90a2a":"getCreditHistory","6044fa244fd7fc61449c344dcbc92b0192ce99b697":"verifyTopupSlip","605cc5ea8e521d90f040e83bac2551723df781cf72":"createCreditLedgerEntry","60ab22f778f039f6b3e3d5dee7412a98120fce76dd":"uploadSlip","70f6c25fa454640458dc9f1b34e8e155d755776d78":"purchasePackage","784a56a98e1d36d7e06126295206385c196e31c1f7":"adminVerifyTransaction"},"",""] */ __turbopack_context__.s([
    "adminGetPendingTransactions",
    ()=>adminGetPendingTransactions,
    "adminVerifyTransaction",
    ()=>adminVerifyTransaction,
    "createCreditLedgerEntry",
    ()=>createCreditLedgerEntry,
    "getCreditHistory",
    ()=>getCreditHistory,
    "getPackages",
    ()=>getPackages,
    "getUserTransactions",
    ()=>getUserTransactions,
    "purchasePackage",
    ()=>purchasePackage,
    "uploadSlip",
    ()=>uploadSlip,
    "verifyTopupSlip",
    ()=>verifyTopupSlip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$easyslip$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/easyslip.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-route] (ecmascript)");
;
;
;
;
;
async function createCreditLedgerEntry(tx, entry) {
    return tx.creditTransaction.create({
        data: {
            userId: entry.userId,
            amount: entry.amount,
            balance: entry.balance,
            type: entry.type,
            description: entry.description,
            refId: entry.refId ?? null
        }
    });
}
async function getPackages() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].package.findMany({
        where: {
            isActive: true
        },
        orderBy: {
            price: "asc"
        }
    });
}
async function getCreditHistory(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].creditTransaction.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 100
    });
}
async function purchasePackage(userId, packageId, method) {
    if (!packageId || typeof packageId !== "string") throw new Error("กรุณาเลือกแพ็กเกจ");
    const pkg = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].package.findUnique({
        where: {
            id: packageId
        }
    });
    if (!pkg || !pkg.isActive) throw new Error("ไม่พบแพ็กเกจ");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);
    const transaction = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.create({
        data: {
            userId,
            packageId: pkg.id,
            amount: pkg.price,
            credits: pkg.totalCredits,
            method,
            status: "pending",
            expiresAt
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
    return {
        transactionId: transaction.id,
        amount: pkg.price,
        credits: pkg.totalCredits,
        method,
        expiresAt
    };
}
async function uploadSlip(transactionId, slipUrl) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: transactionId
    });
    const transaction = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findUnique({
        where: {
            id: transactionId
        }
    });
    if (!transaction) throw new Error("ไม่พบรายการ");
    if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.update({
        where: {
            id: transactionId
        },
        data: {
            slipUrl
        }
    });
    // Auto-verify with EasySlip API
    const slipResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$easyslip$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifySlipByUrl"])(slipUrl);
    if (slipResult.success && slipResult.data) {
        const slipData = slipResult.data;
        const slipAmount = slipData.amount * 100; // Convert baht to satang
        const expectedAmount = transaction.amount;
        // Verify amount matches (allow 1 satang tolerance)
        if (Math.abs(slipAmount - expectedAmount) <= 1) {
            // Check reference not already used
            const existingRef = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findFirst({
                where: {
                    reference: slipData.transRef,
                    status: "verified",
                    id: {
                        not: transactionId
                    }
                }
            });
            if (existingRef) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
                return {
                    status: "rejected",
                    transactionId,
                    error: "สลิปนี้ถูกใช้ไปแล้ว"
                };
            }
            // Auto-approve: add credits
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
                await tx.transaction.update({
                    where: {
                        id: transactionId
                    },
                    data: {
                        status: "verified",
                        reference: slipData.transRef,
                        verifiedAt: new Date(),
                        verifiedBy: "easyslip-auto"
                    }
                });
                const updatedUser = await tx.user.update({
                    where: {
                        id: transaction.userId
                    },
                    data: {
                        credits: {
                            increment: transaction.credits
                        }
                    },
                    select: {
                        credits: true
                    }
                });
                await createCreditLedgerEntry(tx, {
                    userId: transaction.userId,
                    amount: transaction.credits,
                    balance: updatedUser.credits,
                    type: "TOPUP",
                    description: `Topup verified from slip ${slipData.transRef}`,
                    refId: transactionId
                });
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
            return {
                status: "verified",
                transactionId,
                credits: transaction.credits
            };
        } else {
            // Amount mismatch — needs manual review
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.update({
                where: {
                    id: transactionId
                },
                data: {
                    reference: slipData.transRef
                }
            });
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
    return {
        status: "pending_review",
        transactionId
    };
}
async function adminVerifyTransaction(adminUserId, transactionId, action, rejectNote) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: transactionId
    });
    // Verify admin role
    const admin = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
        where: {
            id: adminUserId,
            role: "admin"
        }
    });
    if (!admin) throw new Error("Unauthorized — admin only");
    const transaction = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findUnique({
        where: {
            id: transactionId
        }
    });
    if (!transaction) throw new Error("ไม่พบรายการ");
    if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");
    if (action === "verify") {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            await tx.transaction.update({
                where: {
                    id: transactionId
                },
                data: {
                    status: "verified",
                    verifiedAt: new Date(),
                    verifiedBy: adminUserId
                }
            });
            const updatedUser = await tx.user.update({
                where: {
                    id: transaction.userId
                },
                data: {
                    credits: {
                        increment: transaction.credits
                    }
                },
                select: {
                    credits: true
                }
            });
            await createCreditLedgerEntry(tx, {
                userId: transaction.userId,
                amount: transaction.credits,
                balance: updatedUser.credits,
                type: "TOPUP",
                description: `Topup approved by admin ${adminUserId}`,
                refId: transactionId
            });
        });
    } else {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.update({
            where: {
                id: transactionId
            },
            data: {
                status: "rejected",
                verifiedBy: adminUserId
            }
        });
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/transactions");
}
async function getUserTransactions(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 50
    });
}
async function adminGetPendingTransactions() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findMany({
        where: {
            status: "pending",
            slipUrl: {
                not: null
            }
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: "asc"
        }
    });
}
async function verifyTopupSlip(userId, payload) {
    if (!payload || typeof payload !== "string") {
        throw new Error("กรุณาแนบสลิปแบบ base64");
    }
    const slipResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$easyslip$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifySlipByBase64"])(payload);
    if (!slipResult.success || !slipResult.data) {
        throw new Error(slipResult.error || "ตรวจสอบสลิปไม่สำเร็จ");
    }
    const slipData = slipResult.data;
    const duplicate = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].transaction.findFirst({
        where: {
            reference: slipData.transRef,
            status: "verified"
        },
        select: {
            id: true
        }
    });
    if (duplicate) {
        throw new Error("สลิปนี้ถูกใช้ไปแล้ว");
    }
    const amountSatang = Math.round(slipData.amount * 100);
    const matchedPackage = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].package.findFirst({
        where: {
            price: amountSatang,
            isActive: true
        },
        orderBy: {
            totalCredits: "desc"
        }
    });
    const creditsToAdd = matchedPackage ? matchedPackage.totalCredits : Math.max(1, Math.round(slipData.amount));
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        const topupTransaction = await tx.transaction.create({
            data: {
                userId,
                packageId: matchedPackage?.id ?? null,
                amount: amountSatang,
                credits: creditsToAdd,
                method: "slip_verify",
                status: "verified",
                reference: slipData.transRef,
                verifiedAt: new Date(),
                verifiedBy: "easyslip-api",
                expiresAt: new Date()
            }
        });
        const updatedUser = await tx.user.update({
            where: {
                id: userId
            },
            data: {
                credits: {
                    increment: creditsToAdd
                }
            },
            select: {
                credits: true
            }
        });
        await createCreditLedgerEntry(tx, {
            userId,
            amount: creditsToAdd,
            balance: updatedUser.credits,
            type: "TOPUP",
            description: matchedPackage ? `Topup from verified slip for package ${matchedPackage.name}` : `Topup from verified slip amount ฿${slipData.amount.toFixed(2)}`,
            refId: topupTransaction.id
        });
        return {
            transactionId: topupTransaction.id,
            reference: slipData.transRef,
            amount: slipData.amount,
            creditsAdded: creditsToAdd,
            creditsBalance: updatedUser.credits,
            matchedPackage: matchedPackage?.name ?? null
        };
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
    return result;
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createCreditLedgerEntry,
    getPackages,
    getCreditHistory,
    purchasePackage,
    uploadSlip,
    adminVerifyTransaction,
    getUserTransactions,
    adminGetPendingTransactions,
    verifyTopupSlip
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(createCreditLedgerEntry, "605cc5ea8e521d90f040e83bac2551723df781cf72", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getPackages, "0069791c7c2dc6f794c961b65f2a4e2cb9373e5a40", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getCreditHistory, "40651319715e6504016696451b59c33f5f5ca90a2a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(purchasePackage, "70f6c25fa454640458dc9f1b34e8e155d755776d78", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(uploadSlip, "60ab22f778f039f6b3e3d5dee7412a98120fce76dd", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(adminVerifyTransaction, "784a56a98e1d36d7e06126295206385c196e31c1f7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(getUserTransactions, "401521bf006f585c80e12e3976ba76f6101c46b7cb", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(adminGetPendingTransactions, "00e0fd45ed5a0fc1d002c36bf903f7b496845802b0", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyTopupSlip, "6044fa244fd7fc61449c344dcbc92b0192ce99b697", null);
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
"[project]/lib/request-auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authenticateRequestUser",
    ()=>authenticateRequestUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-auth.ts [app-route] (ecmascript)");
;
;
async function authenticateRequestUser(req) {
    const sessionUser = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSession"])();
    if (sessionUser) {
        return sessionUser;
    }
    try {
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authenticateApiKey"])(req);
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ApiError"]) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ApiError"](401, "Unauthorized");
        }
        throw error;
    }
}
}),
"[project]/app/api/credits/history/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/payments.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$request$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/request-auth.ts [app-route] (ecmascript)");
;
;
;
async function GET(req) {
    try {
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$request$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authenticateRequestUser"])(req);
        const transactions = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCreditHistory"])(user.id);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiResponse"])({
            transactions
        });
    } catch (error) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiError"])(error);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__55a8fd60._.js.map