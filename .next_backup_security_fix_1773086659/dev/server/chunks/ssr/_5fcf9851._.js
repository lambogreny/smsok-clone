module.exports = [
"[project]/lib/validations.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-rsc] (ecmascript) <export * as z>");
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง").safeParse(value).success;
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
const phoneSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizePhoneInput).refine((value)=>SANITIZED_PHONE_REGEX.test(value), "เบอร์โทรไม่ถูกต้อง");
const optionalPhoneSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
]).transform((value)=>{
    if (typeof value !== "string") return undefined;
    const sanitized = sanitizePhoneInput(value);
    return sanitized === "" ? undefined : sanitized;
}).refine((value)=>value === undefined || SANITIZED_PHONE_REGEX.test(value), "เบอร์โทรไม่ถูกต้อง");
const emailSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeEmailInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("อีเมลไม่ถูกต้อง"));
const optionalEmailSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
]).transform((value)=>{
    if (typeof value !== "string") return value;
    const sanitized = sanitizeEmailInput(value);
    return sanitized;
}).refine((value)=>value === undefined || value === "" || isValidEmail(value), "อีเมลไม่ถูกต้อง");
const amountSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0, "จำนวนเงินต้องไม่ติดลบ");
function messageSchema(min, max, requiredMessage, maxMessage) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeTextInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(min, requiredMessage).max(max, maxMessage));
}
function sanitizedNameSchema(min, max, requiredMessage, maxMessage) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeNameInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(min, requiredMessage).max(max, maxMessage)).refine((value)=>!INVALID_NAME_CHAR_REGEX.test(value), "ชื่อมีอักขระไม่อนุญาต");
}
function sanitizedOptionalTextSchema(max, maxMessage) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(""),
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
    ]).transform((value)=>{
        if (typeof value !== "string") return value;
        return sanitizeTextInput(value);
    }).refine((value)=>value === undefined || value.length <= max, maxMessage);
}
const registerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(2, 100, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร", "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100).regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว").regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว")
});
const loginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: emailSchema,
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณากรอกรหัสผ่าน")
});
const strongPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100).regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว").regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว");
const forgotPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    phone: phoneSchema
});
const resetPasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    token: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(12, "โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง").max(128, "โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง"),
    newPassword: strongPasswordSchema
});
const changePasswordSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    currentPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    newPassword: strongPasswordSchema,
    confirmPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
}).refine((data)=>data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: [
        "confirmPassword"
    ]
});
const updateProfileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(2, 100, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร", "ชื่อต้องไม่เกิน 100 ตัวอักษร")
});
const sendSmsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9 ]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น"),
    recipient: phoneSchema,
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendBatchSmsSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(11).regex(/^[A-Za-z0-9 ]+$/),
    recipients: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(phoneSchema).min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์").max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendSmsApiSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().default("EasySlip"),
    to: phoneSchema,
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendBatchSmsApiSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().default("EasySlip"),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(phoneSchema).min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์").max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร")
});
const sendOtpSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    phone: phoneSchema,
    purpose: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "verify",
        "login",
        "transaction"
    ]).default("verify")
});
const verifyOtpSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ref: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(6, "ref ไม่ถูกต้อง").max(32, "ref ไม่ถูกต้อง").regex(/^[A-Za-z0-9]+$/, "ref ไม่ถูกต้อง").transform((value)=>value.toUpperCase()),
    code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{6}$/, "รหัส OTP ไม่ถูกต้อง")
});
const createContactSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อ", "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
    phone: phoneSchema,
    email: optionalEmailSchema,
    tags: sanitizedOptionalTextSchema(500, "tags ต้องไม่เกิน 500 ตัวอักษร")
});
const updateContactSchema = createContactSchema.partial();
const createContactGroupSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อกลุ่ม", "ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร")
});
const addGroupMembersSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    contactIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()).min(1)
});
const addContactsToGroupSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    groupId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    contactIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()).min(1, "กรุณาเลือกรายชื่ออย่างน้อย 1 รายชื่อ")
});
const contactFilterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20),
    tagId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional()
});
const hexColorSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^#[0-9A-Fa-f]{6}$/, "สีต้องเป็นรหัส HEX เช่น #94A3B8");
const createTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อแท็ก", "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร"),
    color: hexColorSchema.default("#94A3B8")
});
const updateTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อแท็ก", "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร").optional(),
    color: hexColorSchema.optional()
}).refine((data)=>data.name !== undefined || data.color !== undefined, {
    message: "กรุณาระบุข้อมูลที่ต้องการแก้ไข"
});
const assignContactTagSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    tagId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()
});
const requestSenderNameSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(sanitizeNameInput).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9 ]+$/, "ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น")).refine((value)=>!INVALID_NAME_CHAR_REGEX.test(value), "ชื่อมีอักขระไม่อนุญาต").transform((value)=>value.toUpperCase())
});
const approveSenderNameSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "approve",
        "reject"
    ]),
    rejectNote: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional()
});
const purchasePackageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    packageId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "กรุณาเลือกแพ็กเกจ"),
    method: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "bank_transfer",
        "promptpay"
    ])
});
const uploadSlipSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    transactionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    slipUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url("URL สลิปไม่ถูกต้อง")
});
const verifyTopupSlipSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    payload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "กรุณาแนบสลิปแบบ base64"),
    mimeType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().optional()
}).superRefine((value, ctx)=>{
    const parsed = parseSlipPayloadInput(value);
    if (!parsed.mimeType || ![
        "image/jpeg",
        "image/png"
    ].includes(parsed.mimeType)) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: "ไฟล์สลิปต้องเป็น JPEG หรือ PNG เท่านั้น",
            path: [
                "payload"
            ]
        });
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(parsed.payload)) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: "ไฟล์สลิป base64 ไม่ถูกต้อง",
            path: [
                "payload"
            ]
        });
    }
    if (estimateBase64Bytes(parsed.payload) > MAX_SLIP_BYTES) {
        ctx.addIssue({
            code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodIssueCode.custom,
            message: "ไฟล์สลิปต้องมีขนาดไม่เกิน 5MB",
            path: [
                "payload"
            ]
        });
    }
}).transform((value)=>parseSlipPayloadInput(value));
const verifyTransactionSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    transactionId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid(),
    action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "verify",
        "reject"
    ]),
    rejectNote: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional()
});
const scheduledSmsCreateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().default("EasySlip"),
    to: phoneSchema,
    message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
    scheduledAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(1, "กรุณาระบุเวลาที่ต้องการส่ง")
});
const scheduledSmsCancelSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("cancel"),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()
});
const createApiKeySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณาตั้งชื่อ API Key", "ชื่อ API Key ต้องไม่เกิน 100 ตัวอักษร")
});
const createCampaignSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อแคมเปญ", "ชื่อแคมเปญต้องไม่เกิน 100 ตัวอักษร"),
    contactGroupId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    senderName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร").max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร").regex(/^[A-Za-z0-9 ]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น").optional(),
    scheduledAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional()
});
const templateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: sanitizedNameSchema(1, 100, "กรุณาตั้งชื่อเทมเพลต", "ชื่อเทมเพลตต้องไม่เกิน 100 ตัวอักษร"),
    content: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
    category: sanitizedNameSchema(1, 50, "กรุณาระบุหมวดหมู่", "หมวดหมู่ต้องไม่เกิน 50 ตัวอักษร").default("general")
});
const contactsImportSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    contacts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(createContactSchema).min(1, "ไม่มีรายชื่อที่จะนำเข้า").max(10000, "นำเข้าได้สูงสุด 10,000 รายชื่อต่อครั้ง")
});
const templateRenderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    templateId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid().optional(),
    content: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร").optional(),
    variables: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional()
}).refine((value)=>Boolean(value.templateId) || Boolean(value.content), {
    message: "Provide templateId or content"
});
const dateInputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].undefined()
]).transform((value)=>{
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
}).refine((value)=>value === undefined || !Number.isNaN(new Date(value).getTime()), "วันที่ไม่ถูกต้อง");
const creditHistoryQuerySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    from: dateInputSchema,
    to: dateInputSchema,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "TOPUP",
        "SMS_SEND",
        "REFUND"
    ]).optional(),
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20)
});
const idSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().cuid()
});
const paginationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20)
});
const dateRangeSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    from: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional()
});
const reportFilterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).default(1),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.number().int().min(1).max(100).default(20),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "pending",
        "sent",
        "delivered",
        "failed"
    ]).optional(),
    senderName: sanitizedOptionalTextSchema(50, "senderName ต้องไม่เกิน 50 ตัวอักษร"),
    search: sanitizedOptionalTextSchema(100, "คำค้นหาต้องไม่เกิน 100 ตัวอักษร"),
    from: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional(),
    to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].coerce.date().optional()
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
"[project]/lib/actions/auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4046e5ccd84d90585a394f3ded5bfa55b92a5f4486":"forgotPassword","40e6138324e767e21cd197fe67f4fd4fd2b8eac82c":"resetPassword"},"",""] */ __turbopack_context__.s([
    "forgotPassword",
    ()=>forgotPassword,
    "resetPassword",
    ()=>resetPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/sms-gateway.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
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
    const { phone } = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forgotPasswordSchema"].parse(input);
    const fallbackPhone = alternatePhone(phone);
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
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
        throw new Error("ไม่พบเบอร์โทรนี้ในระบบ");
    }
    const windowStart = new Date(Date.now() - RESET_RATE_WINDOW_MS);
    const recentCount = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.count({
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
    const record = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.create({
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
            const smsResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendSingleSms"])(user.phone, message, "EasySlip");
            if (!smsResult.success) {
                throw new Error(smsResult.error || "ส่งรหัสรีเซ็ตรหัสผ่านไม่สำเร็จ");
            }
        } catch  {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.delete({
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
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resetPasswordSchema"].parse(input);
    const { refCode, secret } = parseResetToken(parsed.token);
    const record = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.findFirst({
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
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
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
    const passwordHash = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hashPassword"])(parsed.newPassword);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id: record.userId
            },
            data: {
                password: passwordHash,
                mustChangePassword: false,
                phoneVerified: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].otpRequest.update({
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
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    forgotPassword,
    resetPassword
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(forgotPassword, "4046e5ccd84d90585a394f3ded5bfa55b92a5f4486", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(resetPassword, "40e6138324e767e21cd197fe67f4fd4fd2b8eac82c", null);
}),
"[project]/lib/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"008f729691ced488406cb11eb9f1b5d29439616cb6":"logout","4001aab6fda6a5a33d32e8b5e5a66c4a412d057c8d":"register","402f459703ff445209b34854b01929b7e190f0cf65":"forgotPassword","406c00b52c4e3093274676bccb5df152fc09c9e4fa":"registerWithOtp","40e39490c8dfe1fa8f709d2ff5d29a4f300c8571c1":"login","6041b2cb9367dd870393e026687ee07538a6306013":"changePasswordForced","604cf6451d20e049bf364bc794a46ca4cbea043784":"resetPassword"},"",""] */ __turbopack_context__.s([
    "changePasswordForced",
    ()=>changePasswordForced,
    "forgotPassword",
    ()=>forgotPassword,
    "login",
    ()=>login,
    "logout",
    ()=>logout,
    "register",
    ()=>register,
    "registerWithOtp",
    ()=>registerWithOtp,
    "resetPassword",
    ()=>resetPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
async function register(formData) {
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerSchema"].safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        password: formData.get("password")
    });
    if (!parsed.success) {
        return {
            error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง"
        };
    }
    const { name, email, phone, password } = parsed.data;
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            email
        }
    });
    if (existing) {
        return {
            error: "อีเมลนี้ถูกใช้งานแล้ว"
        };
    }
    const hashed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hashPassword"])(password);
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.create({
        data: {
            name,
            email,
            phone,
            password: hashed
        }
    });
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setSession"])(user.id);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/dashboard");
}
async function registerWithOtp(data) {
    const { verifyOtpForRegister } = await __turbopack_context__.A("[project]/lib/actions/otp.ts [app-rsc] (ecmascript, async loader)");
    // Verify OTP first
    const otpResult = await verifyOtpForRegister(data.otpRef, data.otpCode);
    if (!otpResult.valid) {
        throw new Error("OTP ไม่ถูกต้อง");
    }
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerSchema"].safeParse({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password
    });
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
    }
    const { name, email, phone, password } = parsed.data;
    const [existingEmail, existingPhone] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
            where: {
                email
            },
            select: {
                id: true
            }
        }),
        phone ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
            where: {
                phone
            },
            select: {
                id: true
            }
        }) : null
    ]);
    if (existingEmail) throw new Error("อีเมลนี้ถูกใช้งานแล้ว");
    if (existingPhone) throw new Error("เบอร์โทรนี้ถูกใช้งานแล้ว");
    const hashed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hashPassword"])(password);
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.create({
        data: {
            name,
            email,
            phone,
            password: hashed,
            phoneVerified: true
        }
    });
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setSession"])(user.id);
}
async function login(formData) {
    const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginSchema"].safeParse({
        email: formData.get("email"),
        password: formData.get("password")
    });
    if (!parsed.success) {
        return {
            error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง"
        };
    }
    const { email, password } = parsed.data;
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            email
        },
        select: {
            id: true,
            password: true,
            mustChangePassword: true
        }
    });
    if (!user) {
        return {
            error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        };
    }
    const valid = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyPassword"])(password, user.password);
    if (!valid) {
        return {
            error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        };
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setSession"])(user.id);
    if (user.mustChangePassword) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/dashboard/settings?forceChange=true");
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/dashboard");
}
async function forgotPassword(phone) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["forgotPassword"])({
        phone
    });
}
async function resetPassword(token, newPassword) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resetPassword"])({
        token,
        newPassword
    });
}
async function changePasswordForced(userId, newPassword) {
    if (!newPassword || newPassword.length < 8) throw new Error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    const hashed = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["hashPassword"])(newPassword);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
        where: {
            id: userId
        },
        data: {
            password: hashed,
            mustChangePassword: false
        }
    });
}
async function logout() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clearSession"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["redirect"])("/");
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    register,
    registerWithOtp,
    login,
    forgotPassword,
    resetPassword,
    changePasswordForced,
    logout
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(register, "4001aab6fda6a5a33d32e8b5e5a66c4a412d057c8d", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(registerWithOtp, "406c00b52c4e3093274676bccb5df152fc09c9e4fa", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(login, "40e39490c8dfe1fa8f709d2ff5d29a4f300c8571c1", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(forgotPassword, "402f459703ff445209b34854b01929b7e190f0cf65", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(resetPassword, "604cf6451d20e049bf364bc794a46ca4cbea043784", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(changePasswordForced, "6041b2cb9367dd870393e026687ee07538a6306013", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(logout, "008f729691ced488406cb11eb9f1b5d29439616cb6", null);
}),
"[project]/lib/easyslip.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/lib/actions/payments.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$easyslip$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/easyslip.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].package.findMany({
        where: {
            isActive: true
        },
        orderBy: {
            price: "asc"
        }
    });
}
async function getCreditHistory(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].creditTransaction.findMany({
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
    const pkg = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].package.findUnique({
        where: {
            id: packageId
        }
    });
    if (!pkg || !pkg.isActive) throw new Error("ไม่พบแพ็กเกจ");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);
    const transaction = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.create({
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
    return {
        transactionId: transaction.id,
        amount: pkg.price,
        credits: pkg.totalCredits,
        method,
        expiresAt
    };
}
async function uploadSlip(transactionId, slipUrl) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: transactionId
    });
    const transaction = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.findUnique({
        where: {
            id: transactionId
        }
    });
    if (!transaction) throw new Error("ไม่พบรายการ");
    if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.update({
        where: {
            id: transactionId
        },
        data: {
            slipUrl
        }
    });
    // Auto-verify with EasySlip API
    const slipResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$easyslip$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifySlipByUrl"])(slipUrl);
    if (slipResult.success && slipResult.data) {
        const slipData = slipResult.data;
        const slipAmount = slipData.amount * 100; // Convert baht to satang
        const expectedAmount = transaction.amount;
        // Verify amount matches (allow 1 satang tolerance)
        if (Math.abs(slipAmount - expectedAmount) <= 1) {
            // Check reference not already used
            const existingRef = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.findFirst({
                where: {
                    reference: slipData.transRef,
                    status: "verified",
                    id: {
                        not: transactionId
                    }
                }
            });
            if (existingRef) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
                return {
                    status: "rejected",
                    transactionId,
                    error: "สลิปนี้ถูกใช้ไปแล้ว"
                };
            }
            // Auto-approve: add credits
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
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
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
            return {
                status: "verified",
                transactionId,
                credits: transaction.credits
            };
        } else {
            // Amount mismatch — needs manual review
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.update({
                where: {
                    id: transactionId
                },
                data: {
                    reference: slipData.transRef
                }
            });
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
    return {
        status: "pending_review",
        transactionId
    };
}
async function adminVerifyTransaction(adminUserId, transactionId, action, rejectNote) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: transactionId
    });
    // Verify admin role
    const admin = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
        where: {
            id: adminUserId,
            role: "admin"
        }
    });
    if (!admin) throw new Error("Unauthorized — admin only");
    const transaction = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.findUnique({
        where: {
            id: transactionId
        }
    });
    if (!transaction) throw new Error("ไม่พบรายการ");
    if (transaction.status !== "pending") throw new Error("รายการนี้ดำเนินการแล้ว");
    if (action === "verify") {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
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
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.update({
            where: {
                id: transactionId
            },
            data: {
                status: "rejected",
                verifiedBy: adminUserId
            }
        });
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/transactions");
}
async function getUserTransactions(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.findMany({
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
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.findMany({
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
    const slipResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$easyslip$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifySlipByBase64"])(payload);
    if (!slipResult.success || !slipResult.data) {
        throw new Error(slipResult.error || "ตรวจสอบสลิปไม่สำเร็จ");
    }
    const slipData = slipResult.data;
    const duplicate = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].transaction.findFirst({
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
    const matchedPackage = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].package.findFirst({
        where: {
            price: amountSatang,
            isActive: true
        },
        orderBy: {
            totalCredits: "desc"
        }
    });
    const creditsToAdd = matchedPackage ? matchedPackage.totalCredits : Math.max(1, Math.round(slipData.amount));
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/topup");
    return result;
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
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
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createCreditLedgerEntry, "605cc5ea8e521d90f040e83bac2551723df781cf72", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getPackages, "0069791c7c2dc6f794c961b65f2a4e2cb9373e5a40", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCreditHistory, "40651319715e6504016696451b59c33f5f5ca90a2a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(purchasePackage, "70f6c25fa454640458dc9f1b34e8e155d755776d78", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(uploadSlip, "60ab22f778f039f6b3e3d5dee7412a98120fce76dd", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(adminVerifyTransaction, "784a56a98e1d36d7e06126295206385c196e31c1f7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getUserTransactions, "401521bf006f585c80e12e3976ba76f6101c46b7cb", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(adminGetPendingTransactions, "00e0fd45ed5a0fc1d002c36bf903f7b496845802b0", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(verifyTopupSlip, "6044fa244fd7fc61449c344dcbc92b0192ce99b697", null);
}),
"[project]/lib/actions/sms.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"403345bf9950af0c648740197f17bd3ada6bc89d5d":"getDashboardStats","6002b115e4a3e04830a47d5f9a747ee0c711f7ce8f":"getMessageStatus","6058cbec34c527362dbc5cd4936089f50b5d82e65c":"sendBatchSms","607a5fbcdc4bac07ff6ac635187850162b936c359f":"getMessages","607ed3296f73e9739e110c241d900dee581b7f921e":"sendSms"},"",""] */ __turbopack_context__.s([
    "getDashboardStats",
    ()=>getDashboardStats,
    "getMessageStatus",
    ()=>getMessageStatus,
    "getMessages",
    ()=>getMessages,
    "sendBatchSms",
    ()=>sendBatchSms,
    "sendSms",
    ()=>sendSms
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/sms-gateway.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/payments.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
async function sendSms(userId, data) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendSmsSchema"].parse(data);
    const smsCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["calculateSmsCount"])(input.message);
    // Check credits
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUniqueOrThrow({
        where: {
            id: userId
        },
        select: {
            credits: true
        }
    });
    if (user.credits < smsCount) {
        throw new Error("เครดิตไม่เพียงพอ กรุณาเติมเงิน");
    }
    // Check sender name is approved
    const sender = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.findFirst({
        where: {
            userId,
            name: input.senderName,
            status: "approved"
        }
    });
    if (!sender && input.senderName !== "EasySlip") {
        throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
    }
    // Create message + deduct credits in transaction
    const { message, updatedUser } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        const createdMessage = await tx.message.create({
            data: {
                userId,
                recipient: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(input.recipient),
                content: input.message,
                senderName: input.senderName,
                creditCost: smsCount,
                status: "pending"
            }
        });
        const nextUser = await tx.user.update({
            where: {
                id: userId
            },
            data: {
                credits: {
                    decrement: smsCount
                }
            },
            select: {
                credits: true
            }
        });
        return {
            message: createdMessage,
            updatedUser: nextUser
        };
    });
    // Send via EasyThunder SMS Gateway
    try {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendSingleSms"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(input.recipient), input.message, input.senderName);
        if (result.success) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
                await tx.message.update({
                    where: {
                        id: message.id
                    },
                    data: {
                        status: "sent",
                        sentAt: new Date(),
                        gatewayId: result.jobId || null
                    }
                });
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createCreditLedgerEntry"])(tx, {
                    userId,
                    amount: -smsCount,
                    balance: updatedUser.credits,
                    type: "SMS_SEND",
                    description: `SMS sent to ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(input.recipient)}`,
                    refId: message.id
                });
            });
        } else {
            // Gateway returned failure — REFUND credits
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.update({
                    where: {
                        id: message.id
                    },
                    data: {
                        status: "failed",
                        errorCode: result.error?.slice(0, 100) || null
                    }
                }),
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        credits: {
                            increment: smsCount
                        }
                    }
                })
            ]);
            throw new Error(result.error || "ส่ง SMS ไม่สำเร็จ");
        }
    } catch (gatewayError) {
        // If gateway throws exception — REFUND credits
        const isSendError = gatewayError instanceof Error && gatewayError.message.includes("ส่ง SMS ไม่สำเร็จ");
        if (!isSendError) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.update({
                    where: {
                        id: message.id
                    },
                    data: {
                        status: "failed"
                    }
                }),
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        credits: {
                            increment: smsCount
                        }
                    }
                })
            ]);
        }
        throw gatewayError;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    return message;
}
async function sendBatchSms(userId, data) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendBatchSmsSchema"].parse(data);
    const smsCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["calculateSmsCount"])(input.message);
    const totalCredits = smsCount * input.recipients.length;
    // Check credits
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUniqueOrThrow({
        where: {
            id: userId
        },
        select: {
            credits: true
        }
    });
    if (user.credits < totalCredits) {
        throw new Error(`เครดิตไม่เพียงพอ ต้องใช้ ${totalCredits} เครดิต (คงเหลือ ${user.credits})`);
    }
    // Check sender name
    const sender = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.findFirst({
        where: {
            userId,
            name: input.senderName,
            status: "approved"
        }
    });
    if (!sender && input.senderName !== "EasySlip") {
        throw new Error("ชื่อผู้ส่งยังไม่ได้รับอนุมัติ");
    }
    // Create messages + deduct credits
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        const created = await tx.message.createMany({
            data: input.recipients.map((phone)=>({
                    userId,
                    recipient: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"])(phone),
                    content: input.message,
                    senderName: input.senderName,
                    creditCost: smsCount,
                    status: "pending"
                }))
        });
        await tx.user.update({
            where: {
                id: userId
            },
            data: {
                credits: {
                    decrement: totalCredits
                }
            }
        });
        return created;
    });
    // Send via EasyThunder SMS Gateway (batches of 1000)
    const normalizedRecipients = input.recipients.map(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["normalizePhone"]);
    const batches = [];
    for(let i = 0; i < normalizedRecipients.length; i += 1000){
        batches.push(normalizedRecipients.slice(i, i + 1000));
    }
    let sentCount = 0;
    let failedCount = 0;
    for (const batch of batches){
        try {
            const batchResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sms$2d$gateway$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendSmsBatch"])({
                recipients: batch,
                message: input.message,
                sender: input.senderName
            });
            if (batchResult.success) {
                sentCount += batch.length;
            } else {
                failedCount += batch.length;
            }
        } catch  {
            failedCount += batch.length;
        }
    }
    // Refund credits for failed messages
    if (failedCount > 0) {
        const refundCredits = smsCount * failedCount;
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.update({
            where: {
                id: userId
            },
            data: {
                credits: {
                    increment: refundCredits
                }
            }
        });
    }
    if (sentCount > 0) {
        const consumedCredits = smsCount * sentCount;
        const balance = user.credits - consumedCredits;
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].creditTransaction.create({
            data: {
                userId,
                amount: -consumedCredits,
                balance,
                type: "SMS_SEND",
                description: `Batch SMS sent to ${sentCount} recipients`
            }
        });
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    return {
        totalMessages: result.count,
        totalCredits,
        sentCount,
        failedCount
    };
}
async function getMessageStatus(userId, messageId) {
    const message = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.findFirst({
        where: {
            id: messageId,
            userId
        },
        select: {
            id: true,
            recipient: true,
            content: true,
            status: true,
            senderName: true,
            creditCost: true,
            sentAt: true,
            deliveredAt: true,
            createdAt: true
        }
    });
    if (!message) throw new Error("ไม่พบข้อความ");
    return message;
}
async function getMessages(userId, filters) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["reportFilterSchema"].parse(filters);
    const skip = (input.page - 1) * input.limit;
    const where = {
        userId
    };
    if (input.status) where.status = input.status;
    if (input.senderName) where.senderName = input.senderName;
    if (input.search) {
        where.OR = [
            {
                recipient: {
                    contains: input.search
                }
            },
            {
                content: {
                    contains: input.search
                }
            }
        ];
    }
    if (input.from || input.to) {
        where.createdAt = {
            ...input.from && {
                gte: input.from
            },
            ...input.to && {
                lte: input.to
            }
        };
    }
    const [messages, total] = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.findMany({
            where,
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: input.limit
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.count({
            where
        })
    ]);
    return {
        messages,
        pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit)
        }
    };
}
async function getDashboardStats(userId) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [user, todayStats, monthStats, recentMessages] = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUniqueOrThrow({
            where: {
                id: userId
            },
            select: {
                credits: true,
                name: true,
                email: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.groupBy({
            by: [
                "status"
            ],
            where: {
                userId,
                createdAt: {
                    gte: startOfDay
                }
            },
            orderBy: {
                status: "asc"
            },
            _count: {
                _all: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.groupBy({
            by: [
                "status"
            ],
            where: {
                userId,
                createdAt: {
                    gte: startOfMonth
                }
            },
            orderBy: {
                status: "asc"
            },
            _count: {
                _all: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 10,
            select: {
                id: true,
                recipient: true,
                status: true,
                senderName: true,
                creditCost: true,
                createdAt: true
            }
        })
    ]);
    const sumCounts = (stats)=>({
            total: stats.reduce((sum, s)=>sum + s._count._all, 0),
            delivered: stats.find((s)=>s.status === "delivered")?._count._all ?? 0,
            failed: stats.find((s)=>s.status === "failed")?._count._all ?? 0,
            sent: stats.find((s)=>s.status === "sent")?._count._all ?? 0,
            pending: stats.find((s)=>s.status === "pending")?._count._all ?? 0
        });
    // 7-day daily breakdown for chart
    const days = [
        "อาทิตย์",
        "จันทร์",
        "อังคาร",
        "พุธ",
        "พฤหัส",
        "ศุกร์",
        "เสาร์"
    ];
    const shortDays = [
        "อา",
        "จ",
        "อ",
        "พ",
        "พฤ",
        "ศ",
        "ส"
    ];
    const last7Days = [];
    for(let i = 6; i >= 0; i--){
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const dayStats = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.groupBy({
            by: [
                "status"
            ],
            where: {
                userId,
                createdAt: {
                    gte: dayStart,
                    lt: dayEnd
                }
            },
            _count: {
                _all: true
            }
        });
        const dayCounts = sumCounts(dayStats);
        last7Days.push({
            day: days[d.getDay()],
            short: shortDays[d.getDay()],
            date: d.toISOString().slice(0, 10),
            sms: dayCounts.total,
            delivered: dayCounts.delivered,
            failed: dayCounts.failed
        });
    }
    // Yesterday stats for delta calculation
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStats = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].message.groupBy({
        by: [
            "status"
        ],
        where: {
            userId,
            createdAt: {
                gte: yesterdayStart,
                lt: yesterdayEnd
            }
        },
        _count: {
            _all: true
        }
    });
    const yesterday = sumCounts(yesterdayStats);
    return {
        user,
        today: sumCounts(todayStats),
        yesterday,
        thisMonth: sumCounts(monthStats),
        recentMessages,
        last7Days
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    sendSms,
    sendBatchSms,
    getMessageStatus,
    getMessages,
    getDashboardStats
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(sendSms, "607ed3296f73e9739e110c241d900dee581b7f921e", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(sendBatchSms, "6058cbec34c527362dbc5cd4936089f50b5d82e65c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getMessageStatus, "6002b115e4a3e04830a47d5f9a747ee0c711f7ce8f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getMessages, "607a5fbcdc4bac07ff6ac635187850162b936c359f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getDashboardStats, "403345bf9950af0c648740197f17bd3ada6bc89d5d", null);
}),
"[project]/lib/actions/sender-names.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"007e6974923bd822a8c9c729fb3827a91cb043d48a":"adminGetPendingSenderNames","40224d06e8b1c571d99047814be13c15f4e9605d65":"getApprovedSenderNames","4053c41ed021a06533d5fd947e25f4ddbbd1f0420f":"getSenderNames","6026104c23161b6d17e56a057706fbaa0d87be0e86":"requestSenderName","60fe7577099a2c6dd42a03a56bede32656688b283a":"adminApproveSenderName"},"",""] */ __turbopack_context__.s([
    "adminApproveSenderName",
    ()=>adminApproveSenderName,
    "adminGetPendingSenderNames",
    ()=>adminGetPendingSenderNames,
    "getApprovedSenderNames",
    ()=>getApprovedSenderNames,
    "getSenderNames",
    ()=>getSenderNames,
    "requestSenderName",
    ()=>requestSenderName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
async function requestSenderName(userId, data) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requestSenderNameSchema"].parse(data);
    // Check duplicate
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.findUnique({
        where: {
            userId_name: {
                userId,
                name: input.name
            }
        }
    });
    if (existing) {
        if (existing.status === "rejected") {
            throw new Error("ชื่อผู้ส่งนี้ถูกปฏิเสธแล้ว กรุณาใช้ชื่ออื่น");
        }
        throw new Error("ชื่อผู้ส่งนี้มีอยู่แล้ว");
    }
    const senderName = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.create({
        data: {
            userId,
            name: input.name
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/senders");
    return senderName;
}
async function getSenderNames(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
}
async function getApprovedSenderNames(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.findMany({
        where: {
            userId,
            status: "approved"
        },
        select: {
            name: true
        },
        orderBy: {
            name: "asc"
        }
    });
}
async function adminApproveSenderName(adminUserId, data) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["approveSenderNameSchema"].parse(data);
    // Verify admin
    const admin = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
        where: {
            id: adminUserId
        },
        select: {
            id: true
        }
    });
    if (!admin) throw new Error("Unauthorized");
    const senderName = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.findUnique({
        where: {
            id: input.id
        }
    });
    if (!senderName) throw new Error("ไม่พบชื่อผู้ส่ง");
    if (senderName.status !== "pending") throw new Error("ชื่อผู้ส่งนี้ดำเนินการแล้ว");
    if (input.action === "approve") {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.update({
            where: {
                id: input.id
            },
            data: {
                status: "approved",
                approvedAt: new Date(),
                approvedBy: adminUserId
            }
        });
    } else {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.update({
            where: {
                id: input.id
            },
            data: {
                status: "rejected",
                rejectNote: input.rejectNote
            }
        });
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/senders");
}
async function adminGetPendingSenderNames() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].senderName.findMany({
        where: {
            status: "pending"
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
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    requestSenderName,
    getSenderNames,
    getApprovedSenderNames,
    adminApproveSenderName,
    adminGetPendingSenderNames
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(requestSenderName, "6026104c23161b6d17e56a057706fbaa0d87be0e86", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getSenderNames, "4053c41ed021a06533d5fd947e25f4ddbbd1f0420f", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getApprovedSenderNames, "40224d06e8b1c571d99047814be13c15f4e9605d65", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(adminApproveSenderName, "60fe7577099a2c6dd42a03a56bede32656688b283a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(adminGetPendingSenderNames, "007e6974923bd822a8c9c729fb3827a91cb043d48a", null);
}),
"[project]/.next-internal/server/app/(dashboard)/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/lib/actions/sms.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/lib/actions/sender-names.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/lib/actions/payments.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/sms.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/sender-names.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/payments.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/.next-internal/server/app/(dashboard)/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/lib/actions/sms.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/lib/actions/sender-names.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/lib/actions/payments.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "0069791c7c2dc6f794c961b65f2a4e2cb9373e5a40",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPackages"],
    "007e6974923bd822a8c9c729fb3827a91cb043d48a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminGetPendingSenderNames"],
    "008f729691ced488406cb11eb9f1b5d29439616cb6",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logout"],
    "00e0fd45ed5a0fc1d002c36bf903f7b496845802b0",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminGetPendingTransactions"],
    "401521bf006f585c80e12e3976ba76f6101c46b7cb",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getUserTransactions"],
    "40224d06e8b1c571d99047814be13c15f4e9605d65",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getApprovedSenderNames"],
    "403345bf9950af0c648740197f17bd3ada6bc89d5d",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDashboardStats"],
    "4053c41ed021a06533d5fd947e25f4ddbbd1f0420f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSenderNames"],
    "40651319715e6504016696451b59c33f5f5ca90a2a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCreditHistory"],
    "6002b115e4a3e04830a47d5f9a747ee0c711f7ce8f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getMessageStatus"],
    "6026104c23161b6d17e56a057706fbaa0d87be0e86",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requestSenderName"],
    "6044fa244fd7fc61449c344dcbc92b0192ce99b697",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyTopupSlip"],
    "6058cbec34c527362dbc5cd4936089f50b5d82e65c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendBatchSms"],
    "605cc5ea8e521d90f040e83bac2551723df781cf72",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createCreditLedgerEntry"],
    "607a5fbcdc4bac07ff6ac635187850162b936c359f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getMessages"],
    "607ed3296f73e9739e110c241d900dee581b7f921e",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendSms"],
    "60ab22f778f039f6b3e3d5dee7412a98120fce76dd",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["uploadSlip"],
    "60fe7577099a2c6dd42a03a56bede32656688b283a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminApproveSenderName"],
    "70f6c25fa454640458dc9f1b34e8e155d755776d78",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["purchasePackage"],
    "784a56a98e1d36d7e06126295206385c196e31c1f7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["adminVerifyTransaction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$dashboard$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/dashboard/page/actions.js { ACTIONS_MODULE0 => "[project]/lib/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/lib/actions/sms.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/lib/actions/sender-names.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/lib/actions/payments.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sms$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/sms.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$sender$2d$names$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/sender-names.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$payments$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/payments.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_5fcf9851._.js.map