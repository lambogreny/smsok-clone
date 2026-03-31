import { z } from "zod";
import { passwordSchema } from "./password-policy";
import {
  normalizeApiKeyPermission,
  normalizeApiKeyPermissions,
} from "./api-key-permissions";
import { ALL_EVENT_IDS, type WebhookEventId } from "./webhook-events";
import { SENDER_NAME_REGEX } from "./sender-name-validation";
import { getSmsSegmentMetrics } from "./sms-segmentation";

// Re-export password policy for frontend
export { passwordSchema, getPasswordStrength, isCommonPassword, PASSWORD_RULES } from "./password-policy";

const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const INVALID_NAME_CHAR_REGEX = /[<>&"']/;
const INVALID_HTML_TAG_CHAR_REGEX = /[<>]/;
const INVALID_WEBHOOK_URL_CHAR_REGEX = /[<>]/;
const SANITIZED_PHONE_REGEX = /^(0[0-9]{9}|\+66[0-9]{9})$/;

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
  return value.trim();
}

function isValidEmail(value: string) {
  return z.string().email("อีเมลไม่ถูกต้อง").safeParse(value).success;
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

export function sanitizedTextBlockSchema(min: number, max: number, requiredMessage: string, maxMessage: string) {
  return z
    .string()
    .transform(sanitizeTextInput)
    .pipe(z.string().min(min, requiredMessage).max(max, maxMessage))
    .refine((value) => !INVALID_HTML_TAG_CHAR_REGEX.test(value), "ข้อความมีอักขระ HTML ที่ไม่อนุญาต");
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
  emailPackageExpiry: z.boolean().optional(),
  emailInvoice: z.boolean().optional(),
  emailSecurity: z.boolean().optional(),
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

// Registration route schema (supports legacy `name` plus current first/last-name + consent flow)
export const registerRouteSchema = z
  .object({
    name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อ", "ชื่อต้องไม่เกิน 100 ตัวอักษร").optional(),
    firstName: sanitizedNameSchema(1, 50, "กรุณากรอกชื่อ", "ชื่อต้องไม่เกิน 50 ตัวอักษร").optional(),
    lastName: sanitizedNameSchema(1, 50, "กรุณากรอกนามสกุล", "นามสกุลต้องไม่เกิน 50 ตัวอักษร").optional(),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    otpRef: z.string().min(1, "กรุณาส่ง otpRef"),
    otpCode: z.string().regex(/^\d{6}$/, "รหัส OTP ไม่ถูกต้อง"),
    acceptTerms: z.boolean().optional(),
    consentService: z.boolean().optional(),
    consentThirdParty: z.boolean().optional(),
    consentMarketing: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasSplitName = Boolean(data.firstName && data.lastName);
    if (!data.name && !hasSplitName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "กรุณากรอกชื่อและนามสกุล",
      });
    }

    const hasRequiredConsents =
      data.acceptTerms === true ||
      (data.consentService === true && data.consentThirdParty === true);

    if (!hasRequiredConsents) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["acceptTerms"],
        message: "กรุณายอมรับเงื่อนไขการใช้งาน",
      });
    }
  })
  .transform((data) => {
    const combinedName = data.name ?? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
    const nameParts = combinedName.split(/\s+/).filter(Boolean);
    const firstName = data.firstName ?? nameParts[0] ?? combinedName;
    const lastName = data.lastName ?? (nameParts.slice(1).join(" ") || firstName);
    const acceptTerms =
      data.acceptTerms === true ||
      (data.consentService === true && data.consentThirdParty === true);

    return {
      firstName,
      lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      otpRef: data.otpRef,
      otpCode: data.otpCode,
      acceptTerms,
      consentService: data.consentService ?? acceptTerms,
      consentThirdParty: data.consentThirdParty ?? acceptTerms,
      consentMarketing: data.consentMarketing ?? false,
    };
  });

// ==========================================
// SMS Validations
// ==========================================

const senderNameSchema = z
  .string()
  .trim()
  .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
  .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
  .regex(SENDER_NAME_REGEX, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น");

export const sendSmsSchema = z.object({
  senderName: senderNameSchema,
  recipient: phoneSchema,
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendBatchSmsSchema = z.object({
  senderName: senderNameSchema,
  recipients: z
    .array(phoneSchema)
    .min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์")
    .max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendSmsApiSchema = z.object({
  sender: senderNameSchema,
  to: phoneSchema,
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendBatchSmsApiSchema = z.object({
  sender: senderNameSchema,
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

const webhookEventSchema = z.custom<WebhookEventId>(
  (value) => typeof value === "string" && ALL_EVENT_IDS.includes(value as WebhookEventId),
  "Event ไม่ถูกต้อง",
)

export const createWebhookSchema = z.object({
  url: z
    .string()
    .trim()
    .url("URL ไม่ถูกต้อง")
    .refine((value) => !INVALID_WEBHOOK_URL_CHAR_REGEX.test(value), "URL ไม่ถูกต้อง"),
  events: z.array(webhookEventSchema).min(1, "กรุณาเลือก event อย่างน้อย 1 รายการ"),
})

export const updateWebhookSchema = z.object({
  url: z
    .string()
    .trim()
    .url("URL ไม่ถูกต้อง")
    .refine((value) => !INVALID_WEBHOOK_URL_CHAR_REGEX.test(value), "URL ไม่ถูกต้อง")
    .optional(),
  events: z.array(webhookEventSchema).min(1).optional(),
  active: z.boolean().optional(),
})

export const webhookTestActionSchema = z.object({
  action: z.literal("test"),
})

export const stopWebhookBodySchema = z.object({
  phone: z.string().min(1, "กรุณาระบุเบอร์โทร"),
  keyword: z.string().optional(), // "STOP", "0", etc.
})

export const testNotificationSchema = z.object({
  template: z.string().min(1, "กรุณาระบุ template"),
  to: z.string().email("อีเมลไม่ถูกต้อง"),
  data: z.record(z.string(), z.unknown()).optional().default({}),
})

export const customFieldValuesSchema = z.object({
  values: z.array(z.object({
    fieldId: z.string().min(1, "กรุณาระบุ fieldId"),
    value: z.string(),
  })).min(1, "กรุณาส่ง values อย่างน้อย 1 รายการ"),
})

// ==========================================
// Contact Validations
// ==========================================

export const createContactSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อ", "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  phone: phoneSchema,
  email: optionalEmailSchema,
  tags: sanitizedOptionalTextSchema(500, "tags ต้องไม่เกิน 500 ตัวอักษร"),
  smsConsent: z.boolean().optional(),
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
        .regex(SENDER_NAME_REGEX, "ต้องเป็น A-Z และ 0-9 เท่านั้น")
    )
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
  slipRef: z
    .string()
    .trim()
    .regex(/^r2:[^\s]+$/, "R2 file ref ไม่ถูกต้อง"),
});

export const adminVerifyTransactionSchema = z.object({
  transactionId: z.string().cuid(),
  action: z.enum(["verify", "reject"]),
  rejectNote: z.string().max(500, "หมายเหตุต้องไม่เกิน 500 ตัวอักษร").optional(),
});

export const verifyTransactionSchema = z.object({
  transactionId: z.string().cuid(),
  action: z.enum(["verify", "reject"]),
  rejectNote: z.string().max(500).optional(),
});

export const scheduledSmsCreateSchema = z.object({
  sender: senderNameSchema,
  to: phoneSchema,
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
  scheduledAt: z.string().trim().min(1, "กรุณาระบุเวลาที่ต้องการส่ง"),
});

export const scheduledSmsCancelSchema = z.object({
  action: z.literal("cancel"),
  id: z.string().cuid(),
});

const recurringConfigSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly", "custom"]),
  cron: z.string().trim().min(1, "กรุณาระบุ cron pattern").optional(),
  endAfter: z.coerce.number().int().positive().optional(),
}).superRefine((value, ctx) => {
  if (value.type === "custom" && !value.cron) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cron"],
      message: "custom recurrence ต้องระบุ cron pattern",
    });
  }
});

export const recurringSmsCreateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  sender: senderNameSchema,
  to: phoneSchema.optional(),
  recipients: z.array(phoneSchema).min(1).optional(),
  groupId: z.string().cuid().optional(),
  message: messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
  scheduledAt: z.string().trim().min(1, "กรุณาระบุเวลาที่ต้องการส่ง"),
  timezone: z.string().trim().min(1).default("Asia/Bangkok"),
  recurring: recurringConfigSchema,
}).refine(
  (value) => Boolean(value.to || value.groupId || value.recipients?.length),
  {
    message: "ต้องระบุ to, recipients หรือ groupId อย่างน้อยหนึ่งอย่าง",
    path: ["to"],
  },
);

// ==========================================
// API Key Validations
// ==========================================

const apiKeyPermissionsSchema = z
  .array(z.string())
  .optional()
  .superRefine((permissions, ctx) => {
    for (const permission of permissions ?? []) {
      if (!normalizeApiKeyPermission(permission)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `สิทธิ์ API Key ไม่ถูกต้อง: ${permission}`,
        });
      }
    }
  })
  .transform((permissions) => normalizeApiKeyPermissions(permissions));

const apiKeyIpWhitelistSchema = z
  .array(z.string().trim().min(1, "IP Whitelist ต้องไม่ว่าง"))
  .optional()
  .transform((entries) => [...new Set((entries ?? []).map((entry) => entry.trim()).filter(Boolean))]);

const apiKeyNameSchema = sanitizedNameSchema(
  1,
  100,
  "กรุณาตั้งชื่อ API Key",
  "ชื่อ API Key ต้องไม่เกิน 100 ตัวอักษร",
);

export const updateApiKeyNameSchema = z.object({
  name: apiKeyNameSchema,
});

export const createApiKeySchema = updateApiKeyNameSchema.extend({
  permissions: apiKeyPermissionsSchema,
  rateLimit: z.coerce.number().int().min(1, "Rate limit ต้องอย่างน้อย 1").max(1000, "Rate limit ต้องไม่เกิน 1,000").optional().default(60),
  ipWhitelist: apiKeyIpWhitelistSchema,
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อองค์กร").max(100),
});

// ==========================================
// Invoice / Accounting Validations
// ==========================================

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "กรุณากรอกรายละเอียด"),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  type: z.enum(["TAX_INVOICE", "RECEIPT", "TAX_INVOICE_RECEIPT", "INVOICE"]).default("TAX_INVOICE"),
  items: z.array(invoiceItemSchema).min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
  subtotal: z.number().min(0),
  applyWht: z.boolean().default(false),
  dueDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  transactionId: z.string().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["SENT", "PAID", "OVERDUE", "VOIDED"]),
});

const campaignMessageBodySchema = messageSchema(1, 1000, "กรุณากรอกข้อความ", "ข้อความต้องไม่เกิน 1,000 ตัวอักษร");

export const createCampaignSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อแคมเปญ", "ชื่อแคมเปญต้องไม่เกิน 100 ตัวอักษร"),
  contactGroupId: z.string().cuid().optional(),
  templateId: z.string().cuid().optional(),
  messageBody: campaignMessageBodySchema.optional(),
  senderName: z
    .string()
    .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
    .regex(SENDER_NAME_REGEX, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น")
    .optional(),
  scheduledAt: z.coerce.date().optional(),
}).refine(
  (value) => Boolean(value.templateId) || Boolean(value.messageBody),
  { path: ["messageBody"], message: "กรุณากรอกข้อความหรือเลือกเทมเพลต" },
).refine(
  (value) => !value.scheduledAt || Boolean(value.senderName),
  { path: ["senderName"], message: "แคมเปญที่ตั้งเวลาต้องระบุชื่อผู้ส่ง" },
);

export const updateCampaignSchema = z.object({
  name: sanitizedNameSchema(1, 100, "กรุณากรอกชื่อแคมเปญ", "ชื่อแคมเปญต้องไม่เกิน 100 ตัวอักษร").optional(),
  contactGroupId: z.string().cuid().nullable().optional(),
  templateId: z.string().cuid().nullable().optional(),
  messageBody: z.union([campaignMessageBodySchema, z.null()]).optional(),
  senderName: z
    .string()
    .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
    .regex(SENDER_NAME_REGEX, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษและตัวเลขเท่านั้น")
    .nullable()
    .optional(),
  scheduledAt: z.union([z.coerce.date(), z.null()]).optional(),
}).refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: "กรุณาระบุข้อมูลที่ต้องการอัปเดต" },
).refine(
  (value) => {
    // If scheduling, senderName must be provided (not null)
    if (value.scheduledAt && value.senderName === null) return false;
    return true;
  },
  { path: ["senderName"], message: "แคมเปญที่ตั้งเวลาต้องระบุชื่อผู้ส่ง" },
);

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

/**
 * Calculate SMS segment count — synced with backend (lib/package/quota.ts)
 * Uses multipart segment sizes: Thai/UCS-2 = 70/67, GSM-7 = 160/153
 * Emoji and non-ASCII/non-Thai chars force UCS-2 encoding
 */
export function calculateSmsCount(message: string): number {
  return getSmsSegmentMetrics(message).segments;
}

/** Calculate credit cost for a message — alias for calculateSmsCount */
export function calculateCreditCost(message: string): number {
  return calculateSmsCount(message);
}

/** Convert phone to local Thai format (0XXXXXXXXX) for display */
export function displayPhone(phone: string): string {
  const s = (phone ?? "").trim();
  if (s.startsWith("+66") && s.length > 3) {
    return "0" + s.slice(3);
  }
  if (s.startsWith("66") && s.length > 2 && !s.startsWith("0")) {
    return "0" + s.slice(2);
  }
  return s;
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
