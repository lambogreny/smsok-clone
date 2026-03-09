"use server";

import { prisma } from "@/lib/db";
import { sendSingleSms } from "@/lib/sms-gateway";
import crypto from "crypto";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 min lockout after max attempts
const MAX_OTP_PER_PHONE_PER_WINDOW = 3; // 3 per 5 min (architect spec #100)
const OTP_RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const OTP_CREDIT_COST = 1;

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function generateOtp_(
  userId: string,
  phone: string,
  purpose: string = "verify"
) {
  // Validate phone
  if (!/^0[689]\d{8}$/.test(phone)) {
    throw new Error("หมายเลขโทรศัพท์ไม่ถูกต้อง");
  }

  // Rate limit: max 3 OTPs per phone per 5 min (architect spec #100)
  const windowStart = new Date(Date.now() - OTP_RATE_WINDOW_MS);
  const recentCount = await prisma.otpRequest.count({
    where: { userId, phone, createdAt: { gte: windowStart } },
  });

  if (recentCount >= MAX_OTP_PER_PHONE_PER_WINDOW) {
    throw new Error("ส่ง OTP มากเกินไป กรุณารอ 5 นาที");
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
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // Create OTP record + deduct credit in transaction
  const [otpRecord] = await prisma.$transaction([
    prisma.otpRequest.create({
      data: { userId, phone, code, purpose, expiresAt },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: OTP_CREDIT_COST } },
    }),
  ]);

  // Send OTP via SMS
  const message = `รหัส OTP ของคุณคือ ${code} (หมดอายุใน 5 นาที)`;
  try {
    await sendSingleSms(phone, message, "EasySlip");
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

  return {
    id: otpRecord.id,
    phone,
    purpose,
    expiresAt: otpRecord.expiresAt.toISOString(),
    creditUsed: OTP_CREDIT_COST,
  };
}

export async function verifyOtp_(
  userId: string,
  phone: string,
  code: string
) {
  if (!code || code.length !== 6) {
    throw new Error("รหัส OTP ไม่ถูกต้อง");
  }

  // Check 15-min lockout: if any OTP for this phone hit max attempts recently
  const lockoutStart = new Date(Date.now() - LOCKOUT_MS);
  const lockedOtp = await prisma.otpRequest.findFirst({
    where: {
      userId,
      phone,
      attempts: { gte: MAX_ATTEMPTS },
      createdAt: { gte: lockoutStart },
    },
  });

  if (lockedOtp) {
    const unlockAt = new Date(lockedOtp.createdAt.getTime() + LOCKOUT_MS);
    const minsLeft = Math.ceil((unlockAt.getTime() - Date.now()) / 60_000);
    throw new Error(`ถูกล็อค กรุณารออีก ${minsLeft} นาที`);
  }

  // Find the latest unexpired, unverified OTP for this phone
  const otp = await prisma.otpRequest.findFirst({
    where: {
      userId,
      phone,
      verified: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw new Error("ไม่พบ OTP หรือ OTP หมดอายุแล้ว");
  }

  // Check max attempts
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new Error("ลองผิดมากเกินไป ถูกล็อค 15 นาที");
  }

  // Increment attempts
  await prisma.otpRequest.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  });

  // Verify code (timing-safe comparison)
  const isValid =
    code.length === otp.code.length &&
    crypto.timingSafeEqual(Buffer.from(code), Buffer.from(otp.code));

  if (!isValid) {
    const remaining = MAX_ATTEMPTS - (otp.attempts + 1);
    throw new Error(`OTP ไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
  }

  // Mark as verified
  await prisma.otpRequest.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  return {
    verified: true,
    phone,
    purpose: otp.purpose,
  };
}
