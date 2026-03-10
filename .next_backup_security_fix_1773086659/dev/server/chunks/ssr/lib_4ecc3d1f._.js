module.exports = [
"[project]/lib/sms-gateway.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/lib/actions/otp.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4029ad19c7db630658f9398e99ba1cab0353d3867f":"verifyOtpForSession","40773b80055c2741001e9e06d3f511c7379145f412":"generateOtpForSession","4082b84b284cfc22c7a9ae6a13c21383757bb31b41":"generateOtpForRegister","6063c1db7918bb647ca83010a081add0cf5c647e3e":"verifyOtpForRegister","70bb83b289f394e3423c89bc3e9a7b9493b1d8a359":"verifyOtp_","7877048c61ef18e36e01f7e289e48a5b2a97ee0d08":"generateOtp_"},"",""] */ __turbopack_context__.s([
    "generateOtpForRegister",
    ()=>generateOtpForRegister,
    "generateOtpForSession",
    ()=>generateOtpForSession,
    "generateOtp_",
    ()=>generateOtp_,
    "verifyOtpForRegister",
    ()=>verifyOtpForRegister,
    "verifyOtpForSession",
    ()=>verifyOtpForSession,
    "verifyOtp_",
    ()=>verifyOtp_
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/sms-gateway.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const MAX_OTP_PER_PHONE_PER_WINDOW = 3; // 3 per 5 min (architect spec #100)
const OTP_RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const OTP_CREDIT_COST = 1;
function getOtpHashSecret() {
    const secret = process.env.OTP_HASH_SECRET?.trim();
    if (!secret) throw new Error("OTP_HASH_SECRET is not configured");
    return secret;
}
function generateOtp() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomInt(100000, 999999).toString();
}
function generateRefCode() {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(4).toString("hex").toUpperCase();
}
function hashOtp(code, refCode) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHmac("sha256", getOtpHashSecret()).update(`${refCode}:${code}`).digest("hex");
}
function timingSafeMatch(left, right) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].timingSafeEqual(a, b);
}
function hasSmsGatewayCredentials() {
    return Boolean(process.env.SMS_API_USERNAME?.trim() && process.env.SMS_API_PASSWORD?.trim());
}
async function requireSessionUserId() {
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSession"])();
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user.id;
}
async function generateOtp_(userId, phone, purpose = "verify", options = {}) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendOtpSchema"].parse({
        phone,
        purpose
    });
    const normalizedPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(input.phone);
    const debugMode = options.debug === true && ("TURBOPACK compile-time value", "development") !== "production";
    // Rate limit: max 3 OTPs per phone per 5 min (architect spec #100)
    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
    const recentCount = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.count({
        where: {
            phone: normalizedPhone,
            createdAt: {
                gte: windowStart
            }
        }
    });
    if (recentCount >= MAX_OTP_PER_PHONE_PER_WINDOW) {
        throw new Error("ส่ง OTP มากเกินไป กรุณารอ 5 นาที");
    }
    // Check user credits
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        },
        select: {
            credits: true
        }
    });
    if (!user || user.credits < OTP_CREDIT_COST) {
        throw new Error("เครดิตไม่เพียงพอ");
    }
    const code = generateOtp();
    const refCode = generateRefCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const codeHash = hashOtp(code, refCode);
    // Create OTP record + deduct credit in transaction
    let otpRecord;
    let updatedUser;
    try {
        [otpRecord, updatedUser] = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.create({
                data: {
                    userId,
                    refCode,
                    phone: normalizedPhone,
                    code: codeHash,
                    purpose: input.purpose,
                    expiresAt
                },
                select: {
                    id: true,
                    refCode: true,
                    phone: true,
                    purpose: true,
                    expiresAt: true
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
                where: {
                    id: userId
                },
                data: {
                    credits: {
                        decrement: OTP_CREDIT_COST
                    }
                },
                select: {
                    credits: true
                }
            })
        ]);
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["Prisma"].PrismaClientKnownRequestError && error.code === "P2002") {
            throw new Error("สร้าง OTP ไม่สำเร็จ กรุณาลองใหม่");
        }
        throw error;
    }
    // Send OTP via SMS
    const message = `รหัส OTP ของคุณคือ ${code} (หมดอายุใน 5 นาที)`;
    let delivery = "sms";
    if (debugMode && !hasSmsGatewayCredentials()) {
        // Localhost testing path: keep Prisma flow real, expose the OTP instead of requiring SMS infra.
        delivery = "debug";
    } else {
        try {
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendSingleSms"])(input.phone, message, "EasySlip");
            if (!result.success) {
                throw new Error(result.error || "ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
            }
        } catch  {
            // Refund credit on send failure
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.delete({
                    where: {
                        id: otpRecord.id
                    }
                }),
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        credits: {
                            increment: OTP_CREDIT_COST
                        }
                    }
                })
            ]);
            throw new Error("ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
        }
    }
    return {
        id: otpRecord.id,
        ref: otpRecord.refCode,
        phone: otpRecord.phone,
        purpose: otpRecord.purpose,
        expiresAt: otpRecord.expiresAt.toISOString(),
        expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
        creditUsed: OTP_CREDIT_COST,
        creditsRemaining: updatedUser.credits,
        delivery,
        ...debugMode && {
            debugCode: code
        }
    };
}
async function verifyOtp_(userId, ref, code) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyOtpSchema"].parse({
        ref,
        code
    });
    const otp = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.findFirst({
        where: {
            userId,
            refCode: input.ref
        },
        select: {
            id: true,
            refCode: true,
            phone: true,
            code: true,
            purpose: true,
            attempts: true,
            verified: true,
            expiresAt: true
        }
    });
    if (!otp) {
        throw new Error("ไม่พบ OTP นี้");
    }
    if (otp.verified) {
        throw new Error("OTP นี้ถูกใช้งานแล้ว");
    }
    if (otp.expiresAt.getTime() < Date.now()) {
        throw new Error("OTP หมดอายุแล้ว");
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
        throw new Error("OTP ถูกล็อคแล้ว กรุณาขอรหัสใหม่");
    }
    // OTP bypass — for testing/support only, never logged
    const bypassCode = process.env.OTP_BYPASS_CODE?.trim();
    if (bypassCode && timingSafeMatch(input.code, bypassCode)) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
            where: {
                id: otp.id
            },
            data: {
                verified: true
            }
        });
        return {
            valid: true,
            verified: true,
            ref: otp.refCode,
            phone: otp.phone,
            purpose: otp.purpose
        };
    }
    const isValid = timingSafeMatch(hashOtp(input.code, otp.refCode), otp.code);
    if (!isValid) {
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
            where: {
                id: otp.id
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
        const remaining = Math.max(0, MAX_ATTEMPTS - updated.attempts);
        if (remaining === 0) {
            throw new Error("OTP ไม่ถูกต้อง และถูกล็อคแล้ว กรุณาขอรหัสใหม่");
        }
        throw new Error(`OTP ไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
        where: {
            id: otp.id
        },
        data: {
            verified: true
        }
    });
    return {
        valid: true,
        verified: true,
        ref: otp.refCode,
        phone: otp.phone,
        purpose: otp.purpose
    };
}
async function generateOtpForSession(data) {
    const userId = await requireSessionUserId();
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendOtpSchema"].parse(data);
    return generateOtp_(userId, input.phone, input.purpose);
}
async function verifyOtpForSession(data) {
    const userId = await requireSessionUserId();
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyOtpSchema"].parse(data);
    return verifyOtp_(userId, input.ref, input.code);
}
async function generateOtpForRegister(phone) {
    const normalizedPhone = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendOtpSchema"].parse({
        phone,
        purpose: "verify"
    }).phone);
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
        where: {
            phone: normalizedPhone
        },
        select: {
            id: true
        }
    });
    if (existing) throw new Error("เบอร์โทรนี้ถูกใช้งานแล้ว");
    const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
    const recentCount = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.count({
        where: {
            phone: normalizedPhone,
            createdAt: {
                gte: windowStart
            }
        }
    });
    if (recentCount >= MAX_OTP_PER_PHONE_PER_WINDOW) {
        throw new Error("ส่ง OTP บ่อยเกินไป กรุณารอสักครู่");
    }
    const code = generateOtp();
    const refCode = generateRefCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.create({
        data: {
            userId: null,
            phone: normalizedPhone,
            code: hashOtp(code, refCode),
            refCode,
            purpose: "verify",
            expiresAt
        }
    });
    const message = `รหัส OTP สมัครสมาชิก SMSOK ของคุณคือ ${code} (หมดอายุใน 5 นาที)`;
    let delivery = "sms";
    if (!process.env.SMS_API_USERNAME?.trim()) {
        delivery = "debug";
    } else {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendSingleSms"])(normalizedPhone, message, "EasySlip");
        if (!result.success) throw new Error("ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
    }
    return {
        ref: refCode,
        expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
        delivery,
        ...delivery === "debug" ? {
            debugCode: code
        } : {}
    };
}
async function verifyOtpForRegister(ref, code) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyOtpSchema"].parse({
        ref,
        code
    });
    const otp = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.findFirst({
        where: {
            refCode: input.ref,
            purpose: "verify"
        },
        select: {
            id: true,
            refCode: true,
            phone: true,
            code: true,
            attempts: true,
            verified: true,
            expiresAt: true
        }
    });
    if (!otp) throw new Error("ไม่พบ OTP นี้");
    if (otp.verified) throw new Error("OTP นี้ถูกใช้งานแล้ว");
    if (otp.expiresAt.getTime() < Date.now()) throw new Error("OTP หมดอายุแล้ว");
    if (otp.attempts >= MAX_ATTEMPTS) throw new Error("OTP ถูกล็อคแล้ว กรุณาขอรหัสใหม่");
    // Bypass check
    const bypassCode = process.env.OTP_BYPASS_CODE?.trim();
    if (bypassCode && timingSafeMatch(input.code, bypassCode)) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
            where: {
                id: otp.id
            },
            data: {
                verified: true
            }
        });
        return {
            valid: true,
            phone: otp.phone
        };
    }
    const isValid = timingSafeMatch(hashOtp(input.code, otp.refCode), otp.code);
    if (!isValid) {
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
            where: {
                id: otp.id
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
        const remaining = Math.max(0, MAX_ATTEMPTS - updated.attempts);
        if (remaining === 0) throw new Error("OTP ไม่ถูกต้อง และถูกล็อคแล้ว กรุณาขอรหัสใหม่");
        throw new Error(`OTP ไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
    }
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
        where: {
            id: otp.id
        },
        data: {
            verified: true
        }
    });
    return {
        valid: true,
        phone: otp.phone
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    generateOtp_,
    verifyOtp_,
    generateOtpForSession,
    verifyOtpForSession,
    generateOtpForRegister,
    verifyOtpForRegister
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(generateOtp_, "7877048c61ef18e36e01f7e289e48a5b2a97ee0d08", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyOtp_, "70bb83b289f394e3423c89bc3e9a7b9493b1d8a359", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(generateOtpForSession, "40773b80055c2741001e9e06d3f511c7379145f412", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyOtpForSession, "4029ad19c7db630658f9398e99ba1cab0353d3867f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(generateOtpForRegister, "4082b84b284cfc22c7a9ae6a13c21383757bb31b41", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyOtpForRegister, "6063c1db7918bb647ca83010a081add0cf5c647e3e", null);
}),
];

//# sourceMappingURL=lib_4ecc3d1f._.js.map