"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendSingleSms } from "@/lib/sms-gateway";
import { normalizePhone, sendOtpSchema, verifyOtpSchema } from "@/lib/validations";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { deductQuota, refundQuota, getRemainingQuota, ensureSufficientQuota } from "../package/quota";
import { InsufficientCreditsError, toInsufficientCreditsResult } from "../quota-errors";
import type { InsufficientCreditsResult } from "../quota-errors";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const MAX_OTP_PER_PHONE_PER_WINDOW = 3; // 3 per 10 min
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const OTP_CREDIT_COST = 1;

type GenerateOtpOptions = {
  debug?: boolean;
};

function getOtpHashSecret(): string {
  const secret = process.env.OTP_HASH_SECRET?.trim();
  if (!secret) throw new Error("ระบบยังไม่พร้อมให้บริการ กรุณาติดต่อผู้ดูแล");
  return secret;
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function generateRefCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function hashOtp(code: string, refCode: string): string {
  return crypto
    .createHmac("sha256", getOtpHashSecret())
    .update(`${refCode}:${code}`)
    .digest("hex");
}

function timingSafeMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hasSmsGatewayCredentials(): boolean {
  return Boolean(
    process.env.SMS_API_USERNAME?.trim() &&
    process.env.SMS_API_PASSWORD?.trim()
  );
}

async function requireSessionUserId() {
  const user = await getSession();
  if (!user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }
  return user.id;
}

export async function generateOtp_(
  userId: string,
  phone: string,
  purpose: string = "verify",
  options: GenerateOtpOptions = {},
  channel: "WEB" | "API" = "WEB",
  ip: string = "unknown"
) {
  const parsed = sendOtpSchema.safeParse({ phone, purpose });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  const input = parsed.data;
  const normalizedPhone = normalizePhone(input.phone);
  const debugMode = options.debug === true && process.env.NODE_ENV !== "production";

  // DB-level fallback: max 3 OTPs per phone per 10 min
  const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
  const recentCount = await prisma.otpRequest.count({
    where: { phone: normalizedPhone, createdAt: { gte: windowStart } },
  });

  if (recentCount >= MAX_OTP_PER_PHONE_PER_WINDOW) {
    throw new Error("ส่ง OTP มากเกินไป กรุณารอ 10 นาที");
  }

  // Check package quota — return structured error (not throw) for server action boundary
  try {
    await ensureSufficientQuota(userId, OTP_CREDIT_COST);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return toInsufficientCreditsResult(err);
    throw err;
  }

  const code = generateOtp();
  const refCode = generateRefCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  const codeHash = hashOtp(code, refCode);

  // Create OTP record + deduct package quota in transaction
  let otpRecord: { id: string; refCode: string; phone: string; purpose: string; expiresAt: Date };
  let deductions: Array<{ purchaseId: string; amount: number }>;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const otp = await tx.otpRequest.create({
        data: {
          userId,
          refCode,
          phone: normalizedPhone,
          code: codeHash,
          purpose: input.purpose,
          expiresAt,
        },
        select: {
          id: true,
          refCode: true,
          phone: true,
          purpose: true,
          expiresAt: true,
        },
      });

      const quotaResult = await deductQuota(tx, userId, OTP_CREDIT_COST);

      return { otp, deductions: quotaResult.deductions };
    });

    otpRecord = result.otp;
    deductions = result.deductions;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("สร้าง OTP ไม่สำเร็จ กรุณาลองใหม่");
    }
    throw error;
  }

  // Send OTP via SMS
  const smsText = `รหัส OTP ของคุณคือ ${code} (หมดอายุใน 5 นาที)`;
  let delivery: "sms" | "debug" = "sms";
  if (debugMode && !hasSmsGatewayCredentials()) {
    // Localhost testing path: keep Prisma flow real, expose the OTP instead of requiring SMS infra.
    delivery = "debug";
  } else {
    try {
      const result = await sendSingleSms(input.phone, smsText, "EasySlip");
      if (!result.success) {
        throw new Error(result.error || "ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch {
      // Refund package quota on send failure
      await prisma.$transaction(async (tx) => {
        await tx.otpRequest.delete({ where: { id: otpRecord.id } });
        for (const d of deductions) {
          await refundQuota(tx, d.purchaseId, d.amount);
        }
      });
      throw new Error("ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  // Log SMS history after confirmed send
  const sentAt = new Date();
  await prisma.message.create({
    data: {
      userId,
      type: "OTP",
      channel,
      senderName: "EasySlip",
      recipient: normalizedPhone,
      content: "[OTP]",
      status: "delivered",
      creditCost: OTP_CREDIT_COST,
      sentAt,
    },
  });

  // Re-fetch remaining quota after deduction
  const updatedQuota = await getRemainingQuota(userId);

  return {
    id: otpRecord.id,
    ref: otpRecord.refCode,
    phone: otpRecord.phone,
    purpose: otpRecord.purpose,
    expiresAt: otpRecord.expiresAt.toISOString(),
    expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
    creditUsed: OTP_CREDIT_COST,
    smsRemaining: updatedQuota.totalRemaining,
    delivery,
    ...(debugMode && { debugCode: code }),
  };
}

export async function verifyOtp_(
  userId: string,
  ref: string,
  code: string
) {
  const parsed = verifyOtpSchema.safeParse({ ref, code });
  if (!parsed.success) {
    throw new Error("OTP ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่");
  }
  const input = parsed.data;

  const otp = await prisma.otpRequest.findFirst({
    where: {
      userId,
      refCode: input.ref,
    },
    select: {
      id: true,
      refCode: true,
      phone: true,
      code: true,
      purpose: true,
      attempts: true,
      verified: true,
      expiresAt: true,
    },
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

  // OTP bypass — dev/staging ONLY, blocked in production
  const bypassCode = process.env.OTP_BYPASS_CODE?.trim();
  if (
    bypassCode &&
    bypassCode.length === 6 &&
    process.env.NODE_ENV !== "production" &&
    timingSafeMatch(input.code, bypassCode)
  ) {
    await prisma.otpRequest.update({
      where: { id: otp.id },
      data: { verified: true, verifiedAt: new Date() },
    });
    return { valid: true, verified: true, ref: otp.refCode, phone: otp.phone, purpose: otp.purpose };
  }

  const isValid = timingSafeMatch(hashOtp(input.code, otp.refCode), otp.code);

  if (!isValid) {
    const updated = await prisma.otpRequest.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const remaining = Math.max(0, MAX_ATTEMPTS - updated.attempts);
    if (remaining === 0) {
      throw new Error("OTP ไม่ถูกต้อง และถูกล็อคแล้ว กรุณาขอรหัสใหม่");
    }
    throw new Error(`OTP ไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
  }

  await prisma.otpRequest.update({
    where: { id: otp.id },
    data: { verified: true, verifiedAt: new Date() },
  });

  return {
    valid: true,
    verified: true,
    ref: otp.refCode,
    phone: otp.phone,
    purpose: otp.purpose,
  };
}

export async function generateOtpForSession(data: unknown) {
  const userId = await requireSessionUserId();
  const parsed = sendOtpSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  return generateOtp_(userId, parsed.data.phone, parsed.data.purpose);
}

export async function verifyOtpForSession(data: unknown) {
  const userId = await requireSessionUserId();
  const parsed = verifyOtpSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }
  return verifyOtp_(userId, parsed.data.ref, parsed.data.code);
}

// ==========================================
// Registration OTP — no userId required
// ==========================================

export async function generateOtpForRegister(phone: string, ip: string = "unknown") {
  const parsedOtp = sendOtpSchema.safeParse({ phone, purpose: "verify" });
  if (!parsedOtp.success) {
    throw new Error(parsedOtp.error.issues[0]?.message || "เบอร์โทรไม่ถูกต้อง");
  }
  const normalizedPhone = normalizePhone(parsedOtp.data.phone);

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone }, select: { id: true } });
  if (existing) throw new Error("เบอร์โทรนี้ถูกใช้งานแล้ว");

  // DB-level fallback
  const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
  const recentCount = await prisma.otpRequest.count({
    where: { phone: normalizedPhone, createdAt: { gte: windowStart } },
  });
  if (recentCount >= MAX_OTP_PER_PHONE_PER_WINDOW) {
    throw new Error("ส่ง OTP บ่อยเกินไป กรุณารอ 10 นาที");
  }

  const code = generateOtp();
  const refCode = generateRefCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // OTP code is hashed before storage — never log plaintext

  await prisma.otpRequest.create({
    data: {
      userId: null,
      phone: normalizedPhone,
      code: hashOtp(code, refCode),
      refCode,
      purpose: "verify",
      expiresAt,
    },
  });

  const message = `รหัส OTP สมัครสมาชิก SMSOK ของคุณคือ ${code} (หมดอายุใน 5 นาที)`;
  let delivery: "sms" | "debug" = "sms";
  if (!process.env.SMS_API_USERNAME?.trim()) {
    delivery = "debug";
  } else {
    const result = await sendSingleSms(normalizedPhone, message, "EasySlip");
    if (!result.success) throw new Error("ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
  }

  return {
    ref: refCode,
    expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
    delivery,
    ...(delivery === "debug" ? { debugCode: code } : {}),
  };
}

export async function verifyOtpForRegister(ref: string, code: string) {
  const parsed = verifyOtpSchema.safeParse({ ref, code });
  if (!parsed.success) {
    // Unified error — don't reveal whether format is wrong vs code is wrong
    throw new Error("OTP ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่");
  }
  const input = parsed.data;

  const otp = await prisma.otpRequest.findFirst({
    where: { refCode: input.ref, purpose: "verify" },
    select: { id: true, refCode: true, phone: true, code: true, attempts: true, verified: true, expiresAt: true },
  });

  if (!otp) throw new Error("ไม่พบ OTP นี้");
  if (otp.verified) throw new Error("OTP นี้ถูกใช้งานแล้ว");
  if (otp.expiresAt.getTime() < Date.now()) throw new Error("OTP หมดอายุแล้ว");
  if (otp.attempts >= MAX_ATTEMPTS) throw new Error("OTP ถูกล็อคแล้ว กรุณาขอรหัสใหม่");

  // Bypass check — dev/staging ONLY, blocked in production
  const bypassCode = process.env.OTP_BYPASS_CODE?.trim();
  if (
    bypassCode &&
    bypassCode.length === 6 &&
    process.env.NODE_ENV !== "production" &&
    timingSafeMatch(input.code, bypassCode)
  ) {
    await prisma.otpRequest.update({
      where: { id: otp.id },
      data: { verified: true, verifiedAt: new Date() },
    });
    return { valid: true, phone: otp.phone };
  }

  const isValid = timingSafeMatch(hashOtp(input.code, otp.refCode), otp.code);
  if (!isValid) {
    const updated = await prisma.otpRequest.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const remaining = Math.max(0, MAX_ATTEMPTS - updated.attempts);
    if (remaining === 0) throw new Error("OTP ไม่ถูกต้อง และถูกล็อคแล้ว กรุณาขอรหัสใหม่");
    throw new Error(`OTP ไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
  }

  await prisma.otpRequest.update({
    where: { id: otp.id },
    data: { verified: true, verifiedAt: new Date() },
  });
  return { valid: true, phone: otp.phone };
}
