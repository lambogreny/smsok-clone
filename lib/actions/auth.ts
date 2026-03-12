
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword, revokeAllUserSessions } from "@/lib/auth";
import { sendSingleSms } from "@/lib/sms-gateway";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";

const RESET_TOKEN_EXPIRY_MS = 5 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;
const RESET_PURPOSE = "password_reset";

function alternatePhone(phone: string) {
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
    throw new Error("ระบบยังไม่พร้อมให้บริการ กรุณาติดต่อผู้ดูแล");
  }
  return secret;
}

function generateResetRefCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function generateResetSecret() {
  return crypto.randomInt(100000, 999999).toString();
}

function buildResetToken(refCode: string, secret: string) {
  return `${refCode}-${secret}`;
}

function parseResetToken(token: string) {
  const normalized = token.trim().toUpperCase();
  const [refCode, secret] = normalized.split("-");

  if (!refCode || !secret || !/^[A-F0-9]{8}$/.test(refCode) || !/^\d{6}$/.test(secret)) {
    throw new Error("โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง");
  }

  return { refCode, secret };
}

function hashResetToken(secret: string, refCode: string) {
  return crypto
    .createHmac("sha256", getResetTokenSecret())
    .update(`${refCode}:${secret}`)
    .digest("hex");
}

function timingSafeMatch(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hasSmsGatewayCredentials() {
  return Boolean(
    process.env.SMS_API_USERNAME?.trim() &&
    process.env.SMS_API_PASSWORD?.trim()
  );
}

export async function forgotPassword(input: unknown) {
  const { phone } = forgotPasswordSchema.parse(input);
  const fallbackPhone = alternatePhone(phone);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, { phone: fallbackPhone }],
    },
    select: {
      id: true,
      phone: true,
    },
  });

  if (!user) {
    // Silent return — prevents HTTP status side-channel enumeration
    // Attacker cannot distinguish "not found" (was: 400) from "found" (200)
    return {
      success: true,
      expiresIn: Math.floor(RESET_TOKEN_EXPIRY_MS / 1000),
      delivery: "sms" as const,
    };
  }

  const refCode = generateResetRefCode();
  const secret = generateResetSecret();
  const resetToken = buildResetToken(refCode, secret);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  const record = await prisma.otpRequest.create({
    data: {
      userId: user.id,
      phone: user.phone,
      refCode,
      code: hashResetToken(secret, refCode),
      purpose: RESET_PURPOSE,
      expiresAt,
    },
    select: {
      id: true,
    },
  });

  const message = `รหัสรีเซ็ตรหัสผ่านของคุณคือ ${resetToken} (หมดอายุใน 5 นาที)`;
  const debugMode = process.env.NODE_ENV !== "production" && !hasSmsGatewayCredentials();

  if (!debugMode) {
    try {
      const smsResult = await sendSingleSms(user.phone, message, "EasySlip");
      if (!smsResult.success) {
        throw new Error(smsResult.error || "ส่งรหัสรีเซ็ตรหัสผ่านไม่สำเร็จ");
      }
    } catch {
      await prisma.otpRequest.delete({ where: { id: record.id } });
      throw new Error("ส่งรหัสรีเซ็ตรหัสผ่านไม่สำเร็จ");
    }
  }

  return {
    success: true,
    expiresIn: Math.floor(RESET_TOKEN_EXPIRY_MS / 1000),
    delivery: debugMode ? "debug" : "sms",
    ...(debugMode ? { debugToken: resetToken } : {}),
  };
}

export async function resetPassword(input: unknown) {
  const parsed = resetPasswordSchema.parse(input);
  const { refCode, secret } = parseResetToken(parsed.token);

  const record = await prisma.otpRequest.findFirst({
    where: {
      refCode,
      purpose: RESET_PURPOSE,
    },
    select: {
      id: true,
      userId: true,
      code: true,
      attempts: true,
      verified: true,
      expiresAt: true,
    },
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
    const updated = await prisma.otpRequest.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    const remaining = Math.max(0, MAX_RESET_ATTEMPTS - updated.attempts);
    if (remaining === 0) {
      throw new Error("โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง และถูกล็อคแล้ว กรุณาขอรหัสใหม่");
    }
    throw new Error(`โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้อง (เหลือ ${remaining} ครั้ง)`);
  }

  // Get current password before updating
  const currentUser = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { password: true },
  });

  const { verifyPassword: verifyPw } = await import("@/lib/auth");

  // Check against current password first
  if (currentUser) {
    const sameAsCurrent = await verifyPw(parsed.newPassword, currentUser.password);
    if (sameAsCurrent) {
      throw new Error("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน");
    }
  }

  // Check password history — reject if matches any of last 5
  const recentPasswords = await prisma.passwordHistory.findMany({
    where: { userId: record.userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { passwordHash: true },
  });

  for (const prev of recentPasswords) {
    const reused = await verifyPw(parsed.newPassword, prev.passwordHash);
    if (reused) {
      throw new Error("ห้ามใช้รหัสผ่านที่เคยใช้แล้ว (5 รหัสล่าสุด)");
    }
  }

  const passwordHash = await hashPassword(parsed.newPassword);

  await prisma.$transaction([
    // Save old password to history
    ...(currentUser ? [prisma.passwordHistory.create({
      data: { userId: record.userId, passwordHash: currentUser.password },
    })] : []),
    // Update password
    prisma.user.update({
      where: { id: record.userId },
      data: {
        password: passwordHash,
        mustChangePassword: false,
        phoneVerified: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.otpRequest.update({
      where: { id: record.id },
      data: {
        verified: true,
      },
    }),
  ]);

  await revokeAllUserSessions(record.userId, { incrementSecurityVersion: true });

  return { success: true };
}
