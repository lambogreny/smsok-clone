
import { prisma } from "@/lib/db"
import { getSession, verifyPassword } from "@/lib/auth"
import { DEFAULT_ORGANIZATION_ID, resolveOrganizationIdForUser } from "@/lib/organizations/resolve"
import { requireOrgRole } from "@/lib/actions/organizations"
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
import { sendEmail } from "@/lib/resend"
import { createHash, randomBytes, timingSafeEqual } from "crypto"

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

// ── Regenerate Backup Codes ─────────────────────────────

export async function regenerate2FARecoveryCodes(code: string) {
  const user = await getSession()
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ")

  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error("รหัส 2FA ต้องเป็นตัวเลข 6 หลัก")
  }

  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id },
  })
  if (!tfa || !tfa.enabled) {
    throw new Error("กรุณาเปิดใช้ 2FA ก่อน")
  }

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

  const recoveryCodes = generateRecoveryCodes()
  const hashedCodes = await hashRecoveryCodes(recoveryCodes)

  await prisma.twoFactorAuth.update({
    where: { userId: user.id },
    data: { recoveryCodes: hashedCodes },
  })

  return {
    success: true,
    recoveryCodes,
  }
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

  await prisma.twoFactorAuth.deleteMany({
    where: { userId: user.id },
  })

  // Clear rate limit on disable
  await reset2FARateLimit(user.id)

  return { success: true }
}

// ── Challenge 2FA (during login) — WITH RATE LIMIT ──────

export async function verify2FAChallenge(userId: string, code: string) {
  if (!code || !/^\d{6}$/.test(code)) {
    throw new Error("รหัส 2FA ต้องเป็นตัวเลข 6 หลัก")
  }

  // Rate limit check: 5 attempts / 15 min
  const rateCheck = await check2FARateLimit(userId)
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
  await reset2FARateLimit(userId)

  return { success: true }
}

// ── Use Recovery Code (during login) — WITH RATE LIMIT ──

export async function useRecoveryCode(userId: string, code: string) {
  if (!code) throw new Error("กรุณากรอก Recovery Code")

  // Rate limit check: shares same limit as TOTP verify
  const rateCheck = await check2FARateLimit(userId)
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
  await reset2FARateLimit(userId)

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

// ══════════════════════════════════════════════════════════
// Remember Device
// ══════════════════════════════════════════════════════════

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

const REMEMBER_TOKEN_DAYS = 30

// ── Create Remember Token ───────────────────────────────

export async function createRememberToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + REMEMBER_TOKEN_DAYS * 24 * 60 * 60 * 1000)

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: {
      rememberTokenHash: tokenHash,
      rememberTokenExpiresAt: expiresAt,
    },
  })

  return token
}

// ── Verify Remember Token ───────────────────────────────

export async function verifyRememberToken(userId: string, token: string): Promise<boolean> {
  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId },
    select: {
      rememberTokenHash: true,
      rememberTokenExpiresAt: true,
    },
  })

  if (!tfa || !tfa.rememberTokenHash || !tfa.rememberTokenExpiresAt) {
    return false
  }

  // Check expiration
  if (new Date() > tfa.rememberTokenExpiresAt) {
    // Token expired — clear it
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        rememberTokenHash: null,
        rememberTokenExpiresAt: null,
      },
    })
    return false
  }

  // Constant-time comparison via hash (timing-safe)
  const candidateHash = hashToken(token)
  if (candidateHash.length !== tfa.rememberTokenHash.length) return false
  return timingSafeEqual(Buffer.from(candidateHash), Buffer.from(tfa.rememberTokenHash))
}

// ── Clear Remember Tokens ───────────────────────────────

export async function clearRememberTokens(userId: string): Promise<void> {
  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (tfa) {
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        rememberTokenHash: null,
        rememberTokenExpiresAt: null,
      },
    })
  }
}

// ══════════════════════════════════════════════════════════
// Recovery via Email
// ══════════════════════════════════════════════════════════

const RECOVERY_TOKEN_EXPIRY_HOURS = 1

// ── Request Recovery Email ──────────────────────────────

export async function requestRecoveryEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  if (!user) throw new Error("ไม่พบผู้ใช้")

  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId },
    select: { enabled: true },
  })
  if (!tfa || !tfa.enabled) {
    throw new Error("ผู้ใช้ไม่ได้เปิดใช้ 2FA")
  }

  const token = randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + RECOVERY_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.twoFactorAuth.update({
    where: { userId },
    data: {
      recoveryTokenHash: tokenHash,
      recoveryTokenExpiresAt: expiresAt,
    },
  })

  const recoveryLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/2fa-recover?token=${token}&userId=${userId}`

  try {
    await sendEmail({
      to: user.email,
      subject: "[SMSOK] ลิงก์กู้คืน 2FA",
      html: `
        <h2>กู้คืนการยืนยันตัวตนสองขั้นตอน</h2>
        <p>คุณได้ขอลิงก์กู้คืน 2FA ลิงก์นี้จะหมดอายุใน ${RECOVERY_TOKEN_EXPIRY_HOURS} ชั่วโมง</p>
        <p><a href="${recoveryLink}">คลิกที่นี่เพื่อปิด 2FA</a></p>
        <p>หรือคัดลอก URL นี้: ${recoveryLink}</p>
        <p>หากคุณไม่ได้ขอ กรุณาเพิกเฉยอีเมลนี้</p>
      `,
      text: `กู้คืน 2FA: ${recoveryLink}\nลิงก์หมดอายุใน ${RECOVERY_TOKEN_EXPIRY_HOURS} ชั่วโมง`,
    })
  } catch {
    // If email fails, recovery link is lost — user must retry
    // NEVER log recovery links (security risk)
  }
}

// ── Process Recovery Token ──────────────────────────────

export async function processRecoveryToken(token: string, userId: string): Promise<{ success: boolean }> {
  const tfa = await prisma.twoFactorAuth.findUnique({
    where: { userId },
    select: {
      enabled: true,
      recoveryTokenHash: true,
      recoveryTokenExpiresAt: true,
    },
  })

  if (!tfa || !tfa.recoveryTokenHash || !tfa.recoveryTokenExpiresAt) {
    throw new Error("ลิงก์กู้คืนไม่ถูกต้องหรือถูกใช้แล้ว")
  }

  // Check expiration
  if (new Date() > tfa.recoveryTokenExpiresAt) {
    // Clear expired token
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        recoveryTokenHash: null,
        recoveryTokenExpiresAt: null,
      },
    })
    throw new Error("ลิงก์กู้คืนหมดอายุแล้ว")
  }

  // Verify token (constant-time comparison)
  const candidateHash = hashToken(token)
  if (candidateHash.length !== tfa.recoveryTokenHash.length ||
      !timingSafeEqual(Buffer.from(candidateHash), Buffer.from(tfa.recoveryTokenHash))) {
    throw new Error("ลิงก์กู้คืนไม่ถูกต้อง")
  }

  // Disable 2FA and clear all tokens
  await prisma.twoFactorAuth.deleteMany({
    where: { userId },
  })

  // Clear rate limit
  reset2FARateLimit(userId)

  return { success: true }
}

// ══════════════════════════════════════════════════════════
// Admin: Enforce 2FA for Organization
// ══════════════════════════════════════════════════════════

// ── Enforce Org 2FA ─────────────────────────────────────

export async function enforceOrg2FA(
  adminUserId: string,
  organizationId: string,
  enforce: boolean
): Promise<{ success: boolean }> {
  // Verify the user is an admin/owner of the organization
  const membership = await prisma.membership.findFirst({
    where: {
      userId: adminUserId,
      organizationId,
      role: { in: ["OWNER", "ADMIN"] },
    },
  })
  if (!membership) {
    throw new Error("คุณไม่มีสิทธิ์จัดการองค์กรนี้")
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { require2fa: enforce },
  })

  return { success: true }
}

// ── Check if Org 2FA is Required ────────────────────────

export async function isOrg2FARequired(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { require2fa: true },
  })
  return org?.require2fa ?? false
}

export async function getDefaultOrgSecurityPolicy(userId: string) {
  const organizationId = await resolveOrganizationIdForUser(userId, DEFAULT_ORGANIZATION_ID)
  await requireOrgRole(userId, organizationId, ["OWNER", "ADMIN", "MEMBER", "VIEWER"])

  return {
    organizationId,
    require2FA: await isOrg2FARequired(organizationId),
  }
}

export async function updateDefaultOrgSecurityPolicy(userId: string, enforce: boolean) {
  const organizationId = await resolveOrganizationIdForUser(userId, DEFAULT_ORGANIZATION_ID)
  await enforceOrg2FA(userId, organizationId, enforce)

  return {
    success: true,
    organizationId,
    require2FA: enforce,
  }
}

export async function getDefaultOrgMember2FAStatuses(userId: string) {
  const organizationId = await resolveOrganizationIdForUser(userId, DEFAULT_ORGANIZATION_ID)
  await requireOrgRole(userId, organizationId, ["OWNER", "ADMIN"])

  const memberships = await prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const memberIds = memberships.map((membership) => membership.userId)
  const twoFactorRecords = await prisma.twoFactorAuth.findMany({
    where: { userId: { in: memberIds } },
    select: {
      userId: true,
      enabled: true,
      createdAt: true,
    },
  })

  const twoFactorByUserId = new Map(
    twoFactorRecords.map((record) => [record.userId, record])
  )

  return {
    organizationId,
    members: memberships.map((membership) => {
      const twoFactor = twoFactorByUserId.get(membership.userId)
      return {
        userId: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        role: membership.role,
        enabled: twoFactor?.enabled ?? false,
        setupAt: twoFactor?.createdAt ?? null,
      }
    }),
  }
}
