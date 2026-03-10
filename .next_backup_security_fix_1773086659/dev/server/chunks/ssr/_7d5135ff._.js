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
        // Silent return — prevents HTTP status side-channel enumeration
        // Attacker cannot distinguish "not found" (was: 400) from "found" (200)
        return {
            success: true,
            expiresIn: Math.floor(RESET_TOKEN_EXPIRY_MS / 1000),
            delivery: "sms"
        };
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
"[project]/lib/actions/contacts.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40255dfaa36646d68f538fec5b6ef3bdd6814f37da":"exportContacts","407ae65ee33241be2b678c9a19ba8528ce661f039c":"getContactGroups","6014ccda82310f5df250c579717c960fcfd740311f":"createContactGroup","60464ffe7737dfb0eb086f305c07f412ef1ce90286":"createContact","60a68788edc5e62bf11747d6869ace23ceff1fdf3c":"getContacts","60c23dde5347105d5f419d8556f36e2aa76205f0ff":"deleteContact","60c34efe0f08c8966fee9b8aecb66b5933c3f38a20":"getContactsByGroup","60ed5715a368196287b0e2d4ff06642528a743ba98":"importContacts","70166bb0d7d818d2dbc5b8fc5b26e3d79924f53fcf":"addContactsToGroup","70b05c8c4ecf11293647f57e55319f24a35cc4940c":"updateContact"},"",""] */ __turbopack_context__.s([
    "addContactsToGroup",
    ()=>addContactsToGroup,
    "createContact",
    ()=>createContact,
    "createContactGroup",
    ()=>createContactGroup,
    "deleteContact",
    ()=>deleteContact,
    "exportContacts",
    ()=>exportContacts,
    "getContactGroups",
    ()=>getContactGroups,
    "getContacts",
    ()=>getContacts,
    "getContactsByGroup",
    ()=>getContactsByGroup,
    "importContacts",
    ()=>importContacts,
    "updateContact",
    ()=>updateContact
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
const contactInclude = {
    groups: {
        include: {
            group: true
        }
    },
    contactTags: {
        include: {
            tag: true
        }
    }
};
async function getContacts(userId, filters) {
    const input = filters ? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["contactFilterSchema"].parse(filters) : {
        page: 1,
        limit: 50,
        tagId: undefined
    };
    const skip = (input.page - 1) * input.limit;
    const where = {
        userId,
        ...input.tagId && {
            contactTags: {
                some: {
                    tagId: input.tagId
                }
            }
        }
    };
    const [contacts, total] = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findMany({
            where,
            include: contactInclude,
            orderBy: {
                createdAt: "desc"
            },
            skip,
            take: input.limit
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.count({
            where
        })
    ]);
    return {
        contacts,
        pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit)
        }
    };
}
async function createContact(userId, data) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createContactSchema"].parse(data);
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findUnique({
        where: {
            userId_phone: {
                userId,
                phone: input.phone
            }
        }
    });
    if (existing) throw new Error("เบอร์โทรนี้มีอยู่แล้ว");
    const contact = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.create({
        data: {
            userId,
            name: input.name,
            phone: input.phone,
            email: input.email || null,
            tags: input.tags || null
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
    return contact;
}
async function updateContact(userId, contactId, data) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: contactId
    });
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateContactSchema"].parse(data);
    const contact = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findFirst({
        where: {
            id: contactId,
            userId
        }
    });
    if (!contact) throw new Error("ไม่พบรายชื่อ");
    if (input.phone && input.phone !== contact.phone) {
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findUnique({
            where: {
                userId_phone: {
                    userId,
                    phone: input.phone
                }
            }
        });
        if (existing) throw new Error("เบอร์โทรนี้มีอยู่แล้ว");
    }
    const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.update({
        where: {
            id: contactId
        },
        data: {
            ...input.name !== undefined && {
                name: input.name
            },
            ...input.phone !== undefined && {
                phone: input.phone
            },
            ...input.email !== undefined && {
                email: input.email || null
            },
            ...input.tags !== undefined && {
                tags: input.tags || null
            }
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
    return updated;
}
async function deleteContact(userId, contactId) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: contactId
    });
    const contact = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findFirst({
        where: {
            id: contactId,
            userId
        }
    });
    if (!contact) throw new Error("ไม่พบรายชื่อ");
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.delete({
        where: {
            id: contactId
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
}
async function importContacts(userId, contacts) {
    if (contacts.length === 0) throw new Error("ไม่มีรายชื่อที่จะนำเข้า");
    if (contacts.length > 10000) throw new Error("นำเข้าได้สูงสุด 10,000 รายชื่อต่อครั้ง");
    const validated = contacts.map((c, i)=>{
        try {
            return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createContactSchema"].parse(c);
        } catch  {
            throw new Error(`แถวที่ ${i + 1}: ข้อมูลไม่ถูกต้อง`);
        }
    });
    let imported = 0;
    let skipped = 0;
    for (const contact of validated){
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.create({
                data: {
                    userId,
                    name: contact.name,
                    phone: contact.phone,
                    email: contact.email || null,
                    tags: contact.tags || null
                }
            });
            imported++;
        } catch  {
            skipped++;
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
    return {
        imported,
        skipped,
        total: contacts.length
    };
}
async function exportContacts(userId) {
    const contacts = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findMany({
        where: {
            userId
        },
        include: {
            groups: {
                include: {
                    group: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            contactTags: {
                include: {
                    tag: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    return contacts.map((c)=>({
            name: c.name,
            phone: c.phone,
            email: c.email || "",
            tags: c.contactTags.length > 0 ? c.contactTags.map((item)=>item.tag.name).join(", ") : c.tags || "",
            groups: c.groups.map((g)=>g.group.name).join(", "),
            createdAt: c.createdAt.toISOString()
        }));
}
async function addContactsToGroup(userId, groupId, contactIds) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: groupId
    });
    if (contactIds.length === 0) throw new Error("กรุณาเลือกรายชื่อ");
    // Verify group ownership
    const group = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contactGroup.findFirst({
        where: {
            id: groupId,
            userId
        }
    });
    if (!group) throw new Error("ไม่พบกลุ่ม");
    // Verify contacts ownership
    const contacts = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findMany({
        where: {
            id: {
                in: contactIds
            },
            userId
        },
        select: {
            id: true
        }
    });
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contactGroupMember.createMany({
        data: contacts.map((c)=>({
                groupId,
                contactId: c.id
            })),
        skipDuplicates: true
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
}
async function getContactsByGroup(userId, groupId) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: groupId
    });
    const group = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contactGroup.findFirst({
        where: {
            id: groupId,
            userId
        },
        include: {
            members: {
                include: {
                    contact: true
                }
            }
        }
    });
    if (!group) throw new Error("ไม่พบกลุ่ม");
    return group.members.map((m)=>m.contact);
}
async function getContactGroups(userId) {
    const groups = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contactGroup.findMany({
        where: {
            userId
        },
        include: {
            _count: {
                select: {
                    members: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    return groups.map((g)=>({
            id: g.id,
            name: g.name,
            memberCount: g._count.members
        }));
}
async function createContactGroup(userId, name) {
    if (!name || name.trim().length === 0) throw new Error("กรุณากรอกชื่อกลุ่ม");
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contactGroup.create({
        data: {
            userId,
            name: name.trim()
        }
    });
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getContacts,
    createContact,
    updateContact,
    deleteContact,
    importContacts,
    exportContacts,
    addContactsToGroup,
    getContactsByGroup,
    getContactGroups,
    createContactGroup
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getContacts, "60a68788edc5e62bf11747d6869ace23ceff1fdf3c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createContact, "60464ffe7737dfb0eb086f305c07f412ef1ce90286", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateContact, "70b05c8c4ecf11293647f57e55319f24a35cc4940c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteContact, "60c23dde5347105d5f419d8556f36e2aa76205f0ff", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(importContacts, "60ed5715a368196287b0e2d4ff06642528a743ba98", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(exportContacts, "40255dfaa36646d68f538fec5b6ef3bdd6814f37da", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addContactsToGroup, "70166bb0d7d818d2dbc5b8fc5b26e3d79924f53fcf", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getContactsByGroup, "60c34efe0f08c8966fee9b8aecb66b5933c3f38a20", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getContactGroups, "407ae65ee33241be2b678c9a19ba8528ce661f039c", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createContactGroup, "6014ccda82310f5df250c579717c960fcfd740311f", null);
}),
"[project]/lib/actions/tags.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40175b14c0cda67a18f35e193337cc559b4bbd7bbf":"getTags","60492537dbc459b53b37bfe1280bd18aa834fa17dc":"deleteTag","60aa82e6dac125a598d314fc2e58a266f8004cdeec":"createTag","70286529796bed0a1c014f00dc3256cf3a02f08650":"unassignTagFromContact","70cd3935aba28cd28d0ebcf3a7e774aebf1b04b0b8":"updateTag","70fdb641dec093850405bdcb8d7d5dfbbddfd7c512":"assignTagToContact"},"",""] */ __turbopack_context__.s([
    "assignTagToContact",
    ()=>assignTagToContact,
    "createTag",
    ()=>createTag,
    "deleteTag",
    ()=>deleteTag,
    "getTags",
    ()=>getTags,
    "unassignTagFromContact",
    ()=>unassignTagFromContact,
    "updateTag",
    ()=>updateTag
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/validations.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
async function getTags(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tag.findMany({
        where: {
            userId
        },
        include: {
            _count: {
                select: {
                    contactTags: true
                }
            }
        },
        orderBy: {
            name: "asc"
        }
    });
}
async function createTag(userId, data) {
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createTagSchema"].parse(data);
    try {
        const tag = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tag.create({
            data: {
                userId,
                name: input.name,
                color: input.color
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
        return tag;
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["Prisma"].PrismaClientKnownRequestError && error.code === "P2002") {
            throw new Error("ชื่อแท็กนี้มีอยู่แล้ว");
        }
        throw error;
    }
}
async function updateTag(userId, tagId, data) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: tagId
    });
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateTagSchema"].parse(data);
    const tag = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tag.findFirst({
        where: {
            id: tagId,
            userId
        }
    });
    if (!tag) throw new Error("ไม่พบแท็ก");
    try {
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tag.update({
            where: {
                id: tagId
            },
            data: {
                ...input.name !== undefined && {
                    name: input.name
                },
                ...input.color !== undefined && {
                    color: input.color
                }
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
        return updated;
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["Prisma"].PrismaClientKnownRequestError && error.code === "P2002") {
            throw new Error("ชื่อแท็กนี้มีอยู่แล้ว");
        }
        throw error;
    }
}
async function deleteTag(userId, tagId) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: tagId
    });
    const tag = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tag.findFirst({
        where: {
            id: tagId,
            userId
        }
    });
    if (!tag) throw new Error("ไม่พบแท็ก");
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tag.delete({
        where: {
            id: tagId
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
}
async function ensureOwnedTagAndContact(userId, contactId, tagId) {
    const [contact, tag] = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contact.findFirst({
            where: {
                id: contactId,
                userId
            },
            select: {
                id: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].tag.findFirst({
            where: {
                id: tagId,
                userId
            },
            select: {
                id: true
            }
        })
    ]);
    if (!contact) throw new Error("ไม่พบรายชื่อ");
    if (!tag) throw new Error("ไม่พบแท็ก");
}
async function assignTagToContact(userId, contactId, data) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: contactId
    });
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["assignContactTagSchema"].parse(data);
    await ensureOwnedTagAndContact(userId, contactId, input.tagId);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contactTag.upsert({
        where: {
            contactId_tagId: {
                contactId,
                tagId: input.tagId
            }
        },
        update: {},
        create: {
            contactId,
            tagId: input.tagId
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
    return {
        success: true
    };
}
async function unassignTagFromContact(userId, contactId, data) {
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["idSchema"].parse({
        id: contactId
    });
    const input = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$validations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["assignContactTagSchema"].parse(data);
    await ensureOwnedTagAndContact(userId, contactId, input.tagId);
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].contactTag.deleteMany({
        where: {
            contactId,
            tagId: input.tagId
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard/contacts");
    return {
        success: true
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getTags,
    createTag,
    updateTag,
    deleteTag,
    assignTagToContact,
    unassignTagFromContact
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getTags, "40175b14c0cda67a18f35e193337cc559b4bbd7bbf", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createTag, "60aa82e6dac125a598d314fc2e58a266f8004cdeec", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateTag, "70cd3935aba28cd28d0ebcf3a7e774aebf1b04b0b8", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteTag, "60492537dbc459b53b37bfe1280bd18aa834fa17dc", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(assignTagToContact, "70fdb641dec093850405bdcb8d7d5dfbbddfd7c512", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(unassignTagFromContact, "70286529796bed0a1c014f00dc3256cf3a02f08650", null);
}),
"[project]/.next-internal/server/app/(dashboard)/dashboard/contacts/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/lib/actions/contacts.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/lib/actions/tags.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/contacts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/tags.ts [app-rsc] (ecmascript)");
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
;
;
;
;
}),
"[project]/.next-internal/server/app/(dashboard)/dashboard/contacts/page/actions.js { ACTIONS_MODULE0 => \"[project]/lib/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/lib/actions/contacts.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/lib/actions/tags.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "008f729691ced488406cb11eb9f1b5d29439616cb6",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logout"],
    "40175b14c0cda67a18f35e193337cc559b4bbd7bbf",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTags"],
    "40255dfaa36646d68f538fec5b6ef3bdd6814f37da",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["exportContacts"],
    "407ae65ee33241be2b678c9a19ba8528ce661f039c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getContactGroups"],
    "6014ccda82310f5df250c579717c960fcfd740311f",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createContactGroup"],
    "60464ffe7737dfb0eb086f305c07f412ef1ce90286",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createContact"],
    "60492537dbc459b53b37bfe1280bd18aa834fa17dc",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteTag"],
    "60a68788edc5e62bf11747d6869ace23ceff1fdf3c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getContacts"],
    "60aa82e6dac125a598d314fc2e58a266f8004cdeec",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createTag"],
    "60c23dde5347105d5f419d8556f36e2aa76205f0ff",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteContact"],
    "60c34efe0f08c8966fee9b8aecb66b5933c3f38a20",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getContactsByGroup"],
    "60ed5715a368196287b0e2d4ff06642528a743ba98",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["importContacts"],
    "70166bb0d7d818d2dbc5b8fc5b26e3d79924f53fcf",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addContactsToGroup"],
    "70286529796bed0a1c014f00dc3256cf3a02f08650",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["unassignTagFromContact"],
    "70b05c8c4ecf11293647f57e55319f24a35cc4940c",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateContact"],
    "70cd3935aba28cd28d0ebcf3a7e774aebf1b04b0b8",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateTag"],
    "70fdb641dec093850405bdcb8d7d5dfbbddfd7c512",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["assignTagToContact"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f28$dashboard$292f$dashboard$2f$contacts$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/(dashboard)/dashboard/contacts/page/actions.js { ACTIONS_MODULE0 => "[project]/lib/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/lib/actions/contacts.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/lib/actions/tags.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$contacts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/contacts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$actions$2f$tags$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/actions/tags.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_7d5135ff._.js.map