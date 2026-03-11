import { z } from "zod";
import { passwordSchema } from "./password-policy";

// Re-export password policy for frontend
export { passwordSchema, getPasswordStrength, isCommonPassword, PASSWORD_RULES } from "./password-policy";

const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const HTML_TAG_REGEX = /<\/?[a-zA-Z][^>]*>/g;
const INVALID_NAME_CHAR_REGEX = /[<>&"']/;
const SANITIZED_PHONE_REGEX = /^(0[0-9]{9}|\+66[0-9]{9})$/;
const MAX_SLIP_BYTES = 5 * 1024 * 1024;

function sanitizePhoneInput(value: string) {
  return value.replace(/[^0-9+]/g, "");
}

function sanitizeEmailInput(value: string) {
  return value.toLowerCase().trim();
}

function sanitizeTextInput(value: string) {
  return value.replace(CONTROL_CHAR_REGEX, "").trim();
}

function sanitizeNameInput(value: string) {
  return value.replace(HTML_TAG_REGEX, "").trim();
}

function isValidEmail(value: string) {
  return z.string().email("อีเมลไม่ถูกต้อง").safeParse(value).success;
}

function parseSlipPayloadInput(input: { payload: string; mimeType?: string }) {
  const trimmedPayload = input.payload.trim();
  const dataUrlMatch = trimmedPayload.match(/^data:(image\/(?:jpeg|png));base64,([\s\S]+)$/i);

  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1].toLowerCase(),
      payload: dataUrlMatch[2].replace(/\s+/g, ""),
    };
  }

  return {
    mimeType: input.mimeType?.trim().toLowerCase(),
    payload: trimmedPayload.replace(/\s+/g, ""),
  };
}

function estimateBase64Bytes(base64: string) {
  const padding = (base64.match(/=*$/)?.[0].length ?? 0);
  return Math.floor((base64.length * 3) / 4) - padding;
}

const phoneSchema = z
  .string()
  .transform(sanitizePhoneInput)
  .refine((value) => SANITIZED_PHONE_REGEX.test(value), "เบอร์โทรไม่ถูกต้อง");

const optionalPhoneSchema = z
  .union([z.string(), z.literal(""), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return undefined;
    const sanitized = sanitizePhoneInput(value);
    return sanitized === "" ? undefined : sanitized;
  })
  .refine((value) => value === undefined || SANITIZED_PHONE_REGEX.test(value), "เบอร์โทรไม่ถูกต้อง");

const emailSchema = z
  .string()
  .transform(sanitizeEmailInput)
  .pipe(z.string().email("อีเมลไม่ถูกต้อง"));

const optionalEmailSchema = z
  .union([z.string(), z.literal(""), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return value;
    const sanitized = sanitizeEmailInput(value);
    return sanitized;
  })
  .refine((value) => value === undefined || value === "" || isValidEmail(value), "อีเมลไม่ถูกต้อง");

const amountSchema = z.number().min(0, "จำนวนเงินต้องไม่ติดลบ");

function messageSchema(min: number, max: number, requiredMessage: string, maxMessage: string) {
  return z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(min, requiredMessage).max(max, maxMessage));
}

function sanitizedNameSchema(min: number, max: number, requiredMessage: string, maxMessage: string) {
  return z
    .string()
    .transform(sanitizeNameInput)
    .pipe(z.string().min(min, requiredMessage).max(max, maxMessage))
    .refine((value) => !INVALID_NAME_CHAR_REGEX.test(value), "ชื่อมีอักขระไม่อนุญาต");
}

function sanitizedOptionalTextSchema(max: number, maxMessage: string) {
  return z
    .union([z.string(), z.literal(""), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string") return value;
      return sanitizeTextInput(value);
    })
    .refine((value) => value === undefined || value.length <= max, maxMessage);
}

// ==========================================
// Auth Validations
// ==========================================

export const registerSchema = z.object({
  firstName: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อ", "ชื่อต้องไม่เกิน 50 ตัวอักษร"),
  lastName: sanitizedNameSchema(1, 50, "กรุณากรอกนามสกุล", "นามสกุลต้องไม่เกิน 50 ตัวอักษร"),
  email: emailSchema,
  phone: optionalPhoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

// Re-export shared password schema for backward compat
const strongPasswordSchema = passwordSchema;

export const forgotPasswordSchema = z.object({
  phone: phoneSchema,
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .trim()
    .min(12, "โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง")
    .max(128, "โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง"),
  newPassword: strongPasswordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: sanitizedNameSchema(2, 100, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร", "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
});

// ==========================================
// Workspace Settings Validations
// ==========================================

export const updateWorkspaceSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณาตั้งชื่อ Workspace", "ชื่อ Workspace ต้องไม่เกิน 100 ตัวอักษร").optional(),
  timezone: z.string().min(1).max(50).optional(),
  language: z.enum(["th", "en"]).optional(),
});

// ==========================================
// Notification Preferences Validations
// ==========================================

export const updateNotificationPrefsSchema = z.object({
  emailCreditLow: z.boolean().optional(),
  emailCampaignDone: z.boolean().optional(),
  emailWeeklyReport: z.boolean().optional(),
  smsCreditLow: z.boolean().optional(),
  smsCampaignDone: z.boolean().optional(),
});

// ==========================================
// 2FA Validations
// ==========================================

export const verify2FASchema = z.object({
  code: z.string().regex(/^\d{6}$/, "รหัส 2FA ต้องเป็นตัวเลข 6 หลัก"),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const challenge2FASchema = z.object({
  challengeToken: z.string().min(1, "กรุณาส่ง challengeToken"),
  code: z.string().regex(/^\d{6}$/, "รหัส 2FA ต้องเป็นตัวเลข 6 หลัก"),
});

export const recovery2FASchema = z.object({
  challengeToken: z.string().min(1, "กรุณาส่ง challengeToken"),
  recoveryCode: z.string().min(1, "กรุณาส่ง Recovery Code"),
});

// ==========================================
// SMS Validations
// ==========================================

export const sendSmsSchema = z.object({
  senderName: z
    .string()
    .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
    .regex(/^[A-Za-z0-9 ]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น"),
  recipient: phoneSchema,
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendBatchSmsSchema = z.object({
  senderName: z
    .string()
    .min(3)
    .max(11)
    .regex(/^[A-Za-z0-9 ]+$/),
  recipients: z
    .array(phoneSchema)
    .min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์")
    .max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendSmsApiSchema = z.object({
  sender: z.string().trim().default("EasySlip"),
  to: phoneSchema,
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendBatchSmsApiSchema = z.object({
  sender: z.string().trim().default("EasySlip"),
  to: z
    .array(phoneSchema)
    .min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์")
    .max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendOtpSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(["verify", "login", "transaction"]).default("verify"),
});

export const verifyOtpSchema = z.object({
  ref: z
    .string()
    .min(6, "ref ไม่ถูกต้อง")
    .max(32, "ref ไม่ถูกต้อง")
    .regex(/^[A-Za-z0-9]+$/, "ref ไม่ถูกต้อง")
    .transform((value) => value.toUpperCase()),
  code: z.string().regex(/^\d{6}$/, "รหัส OTP ไม่ถูกต้อง"),
});

// ==========================================
// Webhook Validations
// ==========================================

const webhookEventSchema = z.enum([
  "sms.sent",
  "sms.delivered",
  "sms.failed",
  "otp.verified",
  "credit.low",
])

export const createWebhookSchema = z.object({
  url: z.string().url("URL ไม่ถูกต้อง"),
  events: z.array(webhookEventSchema).min(1, "กรุณาเลือก event อย่างน้อย 1 รายการ"),
})

export const updateWebhookSchema = z.object({
  url: z.string().url("URL ไม่ถูกต้อง").optional(),
  events: z.array(webhookEventSchema).min(1).optional(),
  active: z.boolean().optional(),
})

// ==========================================
// Contact Validations
// ==========================================

export const createContactSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อ", "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  phone: phoneSchema,
  email: optionalEmailSchema,
  tags: sanitizedOptionalTextSchema(500, "tags ต้องไม่เกิน 500 ตัวอักษร"),
});

export const updateContactSchema = createContactSchema.partial();

export const createContactGroupSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อกลุ่ม", "ชื่อกลุ่มต้องไม่เกิน 100 ตัวอักษร"),
});

export const addGroupMembersSchema = z.object({
  contactIds: z.array(z.string().cuid()).min(1),
});

export const addContactsToGroupSchema = z.object({
  groupId: z.string().cuid(),
  contactIds: z.array(z.string().cuid()).min(1, "กรุณาเลือกรายชื่ออย่างน้อย 1 รายชื่อ"),
});

export const contactFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tagId: z.string().cuid().optional(),
});

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "สีต้องเป็นรหัส HEX เช่น #94A3B8");

export const createTagSchema = z.object({
  name: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อแท็ก", "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร"),
  color: hexColorSchema.default("#94A3B8"),
});

export const updateTagSchema = z
  .object({
    name: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อแท็ก", "ชื่อแท็กต้องไม่เกิน 50 ตัวอักษร").optional(),
    color: hexColorSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.color !== undefined, {
    message: "กรุณาระบุข้อมูลที่ต้องการแก้ไข",
  });

export const assignContactTagSchema = z.object({
  tagId: z.string().cuid(),
});

// ==========================================
// Sender Name Validations
// ==========================================

export const requestSenderNameSchema = z.object({
  name: z
    .string()
    .transform(sanitizeNameInput)
    .pipe(
      z
        .string()
        .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
        .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
        .regex(/^[A-Za-z0-9 ]+$/, "ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น")
    )
    .refine((value) => !INVALID_NAME_CHAR_REGEX.test(value), "ชื่อมีอักขระไม่อนุญาต")
    .transform((value: string) => value.toUpperCase()),
});

export const approveSenderNameSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["approve", "reject"]),
  rejectNote: z.string().max(500).optional(),
});

// ==========================================
// Payment Validations
// ==========================================

export const purchasePackageSchema = z.object({
  packageId: z.string().min(1, "กรุณาเลือกแพ็กเกจ"),
  method: z.enum(["bank_transfer", "promptpay"]),
});

export const uploadSlipSchema = z.object({
  transactionId: z.string().cuid(),
  slipUrl: z.string().url("URL สลิปไม่ถูกต้อง"),
});

export const verifyTopupSlipSchema = z
  .object({
    payload: z.string().trim().min(1, "กรุณาแนบสลิปแบบ base64"),
    mimeType: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const parsed = parseSlipPayloadInput(value);

    if (!parsed.mimeType || !["image/jpeg", "image/png"].includes(parsed.mimeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ไฟล์สลิปต้องเป็น JPEG หรือ PNG เท่านั้น",
        path: ["payload"],
      });
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(parsed.payload)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ไฟล์สลิป base64 ไม่ถูกต้อง",
        path: ["payload"],
      });
    }

    if (estimateBase64Bytes(parsed.payload) > MAX_SLIP_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ไฟล์สลิปต้องมีขนาดไม่เกิน 5MB",
        path: ["payload"],
      });
    }
  })
  .transform((value) => parseSlipPayloadInput(value));

export const verifyTransactionSchema = z.object({
  transactionId: z.string().cuid(),
  action: z.enum(["verify", "reject"]),
  rejectNote: z.string().max(500).optional(),
});

export const scheduledSmsCreateSchema = z.object({
  sender: z.string().trim().default("EasySlip"),
  to: phoneSchema,
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
  scheduledAt: z.string().trim().min(1, "กรุณาระบุเวลาที่ต้องการส่ง"),
});

export const scheduledSmsCancelSchema = z.object({
  action: z.literal("cancel"),
  id: z.string().cuid(),
});

// ==========================================
// API Key Validations
// ==========================================

export const createApiKeySchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณาตั้งชื่อ API Key", "ชื่อ API Key ต้องไม่เกิน 100 ตัวอักษร"),
});

export const updateAutoTopupSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().int().min(0, "Threshold ต้องไม่ต่ำกว่า 0"),
  packageId: z.string().cuid("กรุณาเลือกแพ็กเกจ"),
  maxPerMonth: z.number().int().min(1).max(50).default(5),
});

export const createCampaignSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อแคมเปญ", "ชื่อแคมเปญต้องไม่เกิน 100 ตัวอักษร"),
  contactGroupId: z.string().cuid().optional(),
  templateId: z.string().cuid().optional(),
  senderName: z
    .string()
    .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
    .regex(/^[A-Za-z0-9 ]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือช่องว่างเท่านั้น")
    .optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const templateSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณาตั้งชื่อเทมเพลต", "ชื่อเทมเพลตต้องไม่เกิน 100 ตัวอักษร"),
  content: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
  category: sanitizedNameSchema(1, 50, "กรุณาระบุหมวดหมู่", "หมวดหมู่ต้องไม่เกิน 50 ตัวอักษร").default("general"),
});

export const contactsImportSchema = z.object({
  contacts: z
    .array(createContactSchema)
    .min(1, "ไม่มีรายชื่อที่จะนำเข้า")
    .max(10000, "นำเข้าได้สูงสุด 10,000 รายชื่อต่อครั้ง"),
});

export const templateRenderSchema = z
  .object({
    templateId: z.string().cuid().optional(),
    content: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร").optional(),
    variables: z.record(z.string(), z.string()).optional(),
  })
  .refine((value) => Boolean(value.templateId) || Boolean(value.content), {
    message: "Provide templateId or content",
  });

const dateInputSchema = z
  .union([z.string(), z.undefined()])
  .transform((value) => {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  })
  .refine((value) => value === undefined || !Number.isNaN(new Date(value).getTime()), "วันที่ไม่ถูกต้อง");

export const creditHistoryQuerySchema = z.object({
  from: dateInputSchema,
  to: dateInputSchema,
  type: z.enum(["TOPUP", "SMS_SEND", "REFUND"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ==========================================
// Common Validations
// ==========================================

export const idSchema = z.object({
  id: z.string().cuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const reportFilterSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["pending", "sent", "delivered", "failed"]).optional(),
    type: z.enum(["SMS", "OTP"]).optional(),
    channel: z.enum(["WEB", "API"]).optional(),
    senderName: sanitizedOptionalTextSchema(50, "senderName ต้องไม่เกิน 50 ตัวอักษร"),
    search: sanitizedOptionalTextSchema(100, "คำค้นหาต้องไม่เกิน 100 ตัวอักษร"),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  });

// ==========================================
// SMS Utility Functions
// ==========================================

/** Calculate SMS count based on message content */
export function calculateSmsCount(message: string): number {
  const hasThai = /[\u0E00-\u0E7F]/.test(message);
  const maxPerSms = hasThai ? 70 : 160;
  return Math.ceil(message.length / maxPerSms);
}

/** Calculate credit cost for a message */
export function calculateCreditCost(message: string): number {
  return calculateSmsCount(message);
}

/** Normalize Thai phone to E.164 format */
export function normalizePhone(phone: string): string {
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

export {
  amountSchema,
  emailSchema,
  optionalEmailSchema,
  optionalPhoneSchema,
  phoneSchema,
};
