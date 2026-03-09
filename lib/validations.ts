import { z } from "zod";

// ==========================================
// Auth Validations
// ==========================================

export const registerSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").max(100).trim(),
  email: z.string().email("อีเมลไม่ถูกต้อง").toLowerCase().trim(),
  phone: z
    .string()
    .regex(/^0[689]\d{8}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0891234567)")
    .optional(),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(100)
    .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
});

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง").toLowerCase().trim(),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง").toLowerCase().trim(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
      .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

// ==========================================
// SMS Validations
// ==========================================

const thaiPhoneRegex = /^0[689]\d{8}$/;

export const sendSmsSchema = z.object({
  senderName: z
    .string()
    .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
    .regex(/^[A-Za-z0-9]+$/, "ชื่อผู้ส่งต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น"),
  recipient: z.string().regex(thaiPhoneRegex, "เบอร์โทรไม่ถูกต้อง"),
  message: z
    .string()
    .min(1, "กรุณากรอกข้อความ")
    .max(1000, "ข้อความต้องไม่เกิน 1,000 ตัวอักษร"),
});

export const sendBatchSmsSchema = z.object({
  senderName: z
    .string()
    .min(3)
    .max(11)
    .regex(/^[A-Za-z0-9]+$/),
  recipients: z
    .array(z.string().regex(thaiPhoneRegex, "เบอร์โทรไม่ถูกต้อง"))
    .min(1, "ต้องมีเบอร์โทรอย่างน้อย 1 เบอร์")
    .max(10000, "ส่งได้สูงสุด 10,000 เบอร์ต่อครั้ง"),
  message: z.string().min(1).max(1000),
});

// ==========================================
// Contact Validations
// ==========================================

export const createContactSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").max(100).trim(),
  phone: z.string().regex(thaiPhoneRegex, "เบอร์โทรไม่ถูกต้อง"),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  tags: z.string().max(500).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const createContactGroupSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกลุ่ม").max(100).trim(),
});

export const addGroupMembersSchema = z.object({
  contactIds: z.array(z.string().cuid()).min(1),
});

// ==========================================
// Sender Name Validations
// ==========================================

export const requestSenderNameSchema = z.object({
  name: z
    .string()
    .min(3, "ชื่อผู้ส่งต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(11, "ชื่อผู้ส่งต้องไม่เกิน 11 ตัวอักษร")
    .regex(/^[A-Za-z0-9]+$/, "ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น")
    .transform((s) => s.toUpperCase()),
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

export const verifyTransactionSchema = z.object({
  transactionId: z.string().cuid(),
  action: z.enum(["verify", "reject"]),
  rejectNote: z.string().max(500).optional(),
});

// ==========================================
// API Key Validations
// ==========================================

export const createApiKeySchema = z.object({
  name: z.string().min(1, "กรุณาตั้งชื่อ API Key").max(100).trim(),
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
    senderName: z.string().optional(),
    search: z.string().max(100).optional(),
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
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    return "+66" + cleaned.slice(1);
  }
  if (cleaned.startsWith("66")) {
    return "+" + cleaned;
  }
  return "+" + cleaned;
}
