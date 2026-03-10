"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendSingleSms } from "@/lib/sms-gateway";
import { normalizePhone, sendOtpSchema, verifyOtpSchema } from "@/lib/validations";
import { checkOtpRateLimit, recordOtpSend } from "@/lib/otp-rate-limit";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

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
    throw new Error("Unauthorized");
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
  const input = sendOtpSchema.parse({ phone, purpose });
  const normalizedPhone = normalizePhone(input.phone);
  const debugMode = options.debug === true && process.env.NODE_ENV !== "production";

  // Redis rate limit: exponential backoff + daily quota + IP limit
  const rateLimit = await checkOtpRateLimit(normalizedPhone, ip);
  if (!rateLimit.allowed) {
    throw new Error(rateLimit.reason || "ส่ง OTP มากเกินไป กรุณารอสักครู่");
  }

  // DB-level fallback: max 3 OTPs per phone per 10 min
  const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
  const recentCount = await prisma.otpRequest.count({
    where: { phone: normalizedPhone, createdAt: { gte: windowStart } },
  });

  if (recentCount >= MAX_OTP_PER_PHONE_PER_WINDOW) {
    throw new Error("ส่ง OTP มากเกินไป กรุณารอ 10 นาที");
  }

  // Check user credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits < OTP_CREDIT_COST) {
    throw new Error("เครดิตไม่เพียงพอ");
  }

  const code = generateOtp();
  const refCode = generateRefCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  const codeHash = hashOtp(code, refCode);

  // Create OTP record + deduct credit in transaction
  let otpRecord: { id: string; refCode: string; phone: string; purpose: string; expiresAt: Date };
  let updatedUser: { credits: number };

  try {
    [otpRecord, updatedUser] = await prisma.$transaction([
      prisma.otpRequest.create({
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
      }),
      prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: OTP_CREDIT_COST } },
        select: { credits: true },
      }),
    ]);
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
      // Refund credit on send failure
      await prisma.$transaction([
        prisma.otpRequest.delete({ where: { id: otpRecord.id } }),
        prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: OTP_CREDIT_COST } },
        }),
      ]);
      throw new Error("ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่");
    }
  }

  // Record successful send for Redis backoff tracking
  await recordOtpSend(normalizedPhone, ip);

  // Log credit deduction + SMS history after confirmed send
  const sentAt = new Date();
  await prisma.$transaction([
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -OTP_CREDIT_COST,
        balance: updatedUser.credits, // already decremented
        type: "OTP_SEND",
        description: `OTP ส่งไปยัง ${normalizedPhone}`,
        refId: otpRecord.id,
      },
    }),
    prisma.message.create({
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
    }),
  ]);

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
      data: { verified: true },
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
    data: { verified: true },
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
  const input = sendOtpSchema.parse(data);
  return generateOtp_(userId, input.phone, input.purpose);
}

export async function verifyOtpForSession(data: unknown) {
  const userId = await requireSessionUserId();
  const input = verifyOtpSchema.parse(data);
  return verifyOtp_(userId, input.ref, input.code);
}

// ==========================================
// Registration OTP — no userId required
// ==========================================

export async function generateOtpForRegister(phone: string, ip: string = "unknown") {
  const normalizedPhone = normalizePhone(sendOtpSchema.parse({ phone, purpose: "verify" }).phone);

  // Anti-enumeration: check rate limit BEFORE phone existence check
  // This way attackers can't distinguish "phone exists" vs "rate limited"
  const rateLimit = await checkOtpRateLimit(normalizedPhone, ip);
  if (!rateLimit.allowed) {
    throw new Error(rateLimit.reason || "ส่ง OTP มากเกินไป กรุณารอสักครู่");
  }

  const existing = await prisma.user.findFirst({ where: { phone: normalizedPhone }, select: { id: true } });
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

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] OTP for ${normalizedPhone} : ${code}  (ref: ${refCode})`);
  }

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

  // Record successful send for Redis backoff tracking
  await recordOtpSend(normalizedPhone, ip);

  return {
    ref: refCode,
    expiresIn: Math.floor(OTP_EXPIRY_MS / 1000),
    remainingToday: rateLimit.remainingToday,
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
    await prisma.otpRequest.update({ where: { id: otp.id }, data: { verified: true } });
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

  await prisma.otpRequest.update({ where: { id: otp.id }, data: { verified: true } });
  return { valid: true, phone: otp.phone };
}
