"use server"

import { prisma } from "@/lib/db"
import { getSession, verifyPassword } from "@/lib/auth"
import {
  generateTotpSecret,
  generateQrCodeDataUrl,
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyRecoveryCode,
  encryptSecret,
  decryptSecret,
  check2FARateLimit,
  reset2FARateLimit,
} from "@/lib/two-factor"

// ── Failed attempt logging (for security audit) ─────────

async function logFailedAttempt(userId: string, type: "totp" | "recovery", ip?: string) {
  // Log to ApiLog-style audit (using console for now, will integrate with AuditLog in Phase 2)
  console.warn(
    `[2FA FAILED] userId=${userId} type=${type} ip=${ip ?? "unknown"} time=${new Date().toISOString()}`
  )
}

// ── Setup 2FA: Generate secret + QR code ────────────────

export async function setup2FA() {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  // Check if already enabled
  const existing = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id },
  })
  if (existing?.enabled) {
    throw new Error("2FA เปิดใช้งานอยู่แล้ว")
  }

  // Get user email for TOTP label
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  })
  if (!fullUser) throw new Error("ไม่พบผู้ใช้")

  const { secret, uri } = generateTotpSecret(fullUser.email)
  const qrCode = await generateQrCodeDataUrl(uri)

  // Generate recovery codes
  const recoveryCodes = generateRecoveryCodes()
  const hashedCodes = await hashRecoveryCodes(recoveryCodes)

  // Encrypt secret before storing
  const encryptedSecret = encryptSecret(secret)

  // Upsert — may have a disabled record from previous setup
  await prisma.twoFactorAuth.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      secret: encryptedSecret,
      recoveryCodes: hashedCodes,
      enabled: false, // Not enabled until verified
    },
    update: {
      secret: encryptedSecret,
      recoveryCodes: hashedCodes,
      enabled: false,
    },
  })

  return {
    qrCode,
    secret, // Show to user for manual entry (plaintext, one-time display)
    recoveryCodes, // Show to user for saving (plaintext, one-time display)
  }
}

// ── Verify & Enable 2FA ─────────────────────────────────

export async function enable2FA(code: string) {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error("รหัส 2FA ต้องเป็นตัวเลข 6 หลัก")
  }

  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id },
  })
  if (!tfa) throw new Error("กรุณาตั้งค่า 2FA ก่อน")
  if (tfa.enabled) throw new Error("2FA เปิดใช้งานอยู่แล้ว")

  // Decrypt secret and verify code
  let secret: string
  try {
    secret = decryptSecret(tfa.secret)
  } catch {
    throw new Error("ไม่สามารถถอดรหัส 2FA ได้ กรุณาตั้งค่าใหม่")
  }

  const valid = verifyTotpCode(secret, code)
  if (!valid) {
    throw new Error("รหัส 2FA ไม่ถูกต้อง")
  }

  await prisma.twoFactorAuth.update({
    where: { userId: user.id },
    data: { enabled: true },
  })

  return { success: true }
}

// ── Disable 2FA ─────────────────────────────────────────

export async function disable2FA(password: string) {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  if (!password) throw new Error("กรุณากรอกรหัสผ่าน")

  // Verify password
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  })
  if (!fullUser) throw new Error("ไม่พบผู้ใช้")

  const valid = await verifyPassword(password, fullUser.password)
  if (!valid) throw new Error("รหัสผ่านไม่ถูกต้อง")

  await prisma.twoFactorAuth.delete({
    where: { userId: user.id },
  })

  // Clear rate limit on disable
  reset2FARateLimit(user.id)

  return { success: true }
}

// ── Challenge 2FA (during login) — WITH RATE LIMIT ──────

export async function verify2FAChallenge(userId: string, code: string) {
  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error("รหัส 2FA ต้องเป็นตัวเลข 6 หลัก")
  }

  // Rate limit check: 5 attempts / 15 min
  const rateCheck = check2FARateLimit(userId)
  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.retryAfterMs / 60000)
    throw new Error(`ลองรหัส 2FA มากเกินไป กรุณารอ ${minutes} นาที`)
  }

  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId },
  })
  if (!tfa || !tfa.enabled) {
    throw new Error("ผู้ใช้ไม่ได้เปิดใช้ 2FA")
  }

  let secret: string
  try {
    secret = decryptSecret(tfa.secret)
  } catch {
    throw new Error("ไม่สามารถถอดรหัส 2FA ได้ กรุณาตั้งค่าใหม่")
  }

  const valid = verifyTotpCode(secret, code)

  if (!valid) {
    // Log failed attempt for security audit
    await logFailedAttempt(userId, "totp")
    throw new Error(
      `รหัส 2FA ไม่ถูกต้อง (เหลือ ${rateCheck.remaining} ครั้ง)`
    )
  }

  // Success — reset rate limit
  reset2FARateLimit(userId)

  return { success: true }
}

// ── Use Recovery Code (during login) — WITH RATE LIMIT ──

export async function useRecoveryCode(userId: string, code: string) {
  if (!code) throw new Error("กรุณากรอก Recovery Code")

  // Rate limit check: shares same limit as TOTP verify
  const rateCheck = check2FARateLimit(userId)
  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.retryAfterMs / 60000)
    throw new Error(`ลองรหัสมากเกินไป กรุณารอ ${minutes} นาที`)
  }

  const normalized = code.trim().toLowerCase()

  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId },
  })
  if (!tfa || !tfa.enabled) {
    throw new Error("ผู้ใช้ไม่ได้เปิดใช้ 2FA")
  }

  const { valid, index } = await verifyRecoveryCode(normalized, tfa.recoveryCodes)

  if (!valid) {
    // Log failed attempt for security audit
    await logFailedAttempt(userId, "recovery")
    throw new Error(
      `Recovery Code ไม่ถูกต้อง (เหลือ ${rateCheck.remaining} ครั้ง)`
    )
  }

  // Success — reset rate limit
  reset2FARateLimit(userId)

  // Mark code as used by replacing with empty string (can't be reused)
  const updatedCodes = [...tfa.recoveryCodes]
  updatedCodes[index] = "" // Empty = used
  await prisma.twoFactorAuth.update({
    where: { userId },
    data: { recoveryCodes: updatedCodes },
  })

  return { success: true, remainingCodes: updatedCodes.filter((c) => c !== "").length }
}

// ── Check if user has 2FA enabled ───────────────────────

export async function has2FAEnabled(userId: string): Promise<boolean> {
  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId },
    select: { enabled: true },
  })
  return tfa?.enabled ?? false
}

// ── Get 2FA status (for settings page) ──────────────────

export async function get2FAStatus() {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id },
    select: {
      enabled: true,
      createdAt: true,
      recoveryCodes: true,
    },
  })

  return {
    enabled: tfa?.enabled ?? false,
    setupAt: tfa?.createdAt ?? null,
    remainingRecoveryCodes: tfa ? tfa.recoveryCodes.filter((c) => c !== "").length : 0,
  }
}
