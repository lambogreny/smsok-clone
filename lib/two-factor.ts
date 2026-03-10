import { createHmac, createCipheriv, createDecipheriv, randomBytes } from "crypto"
import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import bcrypt from "bcryptjs"
import { env } from "./env"

const APP_NAME = "SMSOK"
const RECOVERY_CODE_COUNT = 8
const RECOVERY_CODE_LENGTH = 8 // 8 hex chars = 4 bytes

// ── Rate Limiting (in-memory) ───────────────────────────
// 5 attempts per 15 minutes per userId

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 min

type RateLimitEntry = {
  attempts: number
  windowStart: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export function check2FARateLimit(userId: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(userId, { attempts: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfterMs: 0 }
  }

  if (entry.attempts >= RATE_LIMIT_MAX) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  entry.attempts++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.attempts, retryAfterMs: 0 }
}

export function reset2FARateLimit(userId: string): void {
  rateLimitMap.delete(userId)
}

// Cleanup stale entries every 30 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key)
    }
  }
}, 30 * 60 * 1000).unref()

// ── Encryption (AES-256-GCM) ────────────────────────────
// Uses dedicated TWO_FA_ENCRYPTION_KEY (separate from JWT_SECRET)
// Falls back to derived key from JWT_SECRET only in dev if env not set

function getEncryptionKey(): Buffer {
  const keySource = env.TWO_FA_ENCRYPTION_KEY
  if (keySource) {
    return createHmac("sha256", keySource)
      .update("smsok-2fa-encryption-key-v2")
      .digest()
  }

  // Fallback for dev only — production MUST set TWO_FA_ENCRYPTION_KEY
  if (env.NODE_ENV === "production") {
    throw new Error("TWO_FA_ENCRYPTION_KEY is required in production")
  }

  return createHmac("sha256", env.JWT_SECRET)
    .update("smsok-2fa-encryption-key-dev-fallback")
    .digest()
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(12) // GCM uses 12-byte nonce
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: iv:authTag:encrypted (all hex)
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted.toString("hex")
}

export function decryptSecret(ciphertext: string): string {
  const key = getEncryptionKey()
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("Invalid encrypted secret format")
  const [ivHex, authTagHex, encHex] = parts
  const iv = Buffer.from(ivHex!, "hex")
  const authTag = Buffer.from(authTagHex!, "hex")
  const encrypted = Buffer.from(encHex!, "hex")
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final("utf8")
}

// ── TOTP ────────────────────────────────────────────────

export function generateTotpSecret(email: string) {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  })

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  }
}

export async function generateQrCodeDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri)
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  })

  // Allow 1 period window (±30s) for clock drift
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

// ── Recovery Codes ──────────────────────────────────────

export function generateRecoveryCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    codes.push(randomBytes(RECOVERY_CODE_LENGTH / 2).toString("hex"))
  }
  return codes
}

export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)))
}

export async function verifyRecoveryCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; index: number }> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const match = await bcrypt.compare(code, hashedCodes[i])
    if (match) return { valid: true, index: i }
  }
  return { valid: false, index: -1 }
}
