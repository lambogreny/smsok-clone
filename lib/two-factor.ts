import { createHmac, createCipheriv, createDecipheriv, randomBytes } from "crypto"
import * as OTPAuth from "otpauth"
import QRCode from "qrcode"
import bcrypt from "bcryptjs"
import { env } from "./env"

const APP_NAME = "SMSOK"
const RECOVERY_CODE_COUNT = 10
const RECOVERY_CODE_LENGTH = 8 // 8 hex chars = 4 bytes

// ── Rate Limiting — removed (handled by Cloudflare) ────────────────────────

export async function check2FARateLimit(
  _userId: string,
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, retryAfterMs: 0 }
}

export async function reset2FARateLimit(_userId: string): Promise<void> {
  // No-op — rate limiting handled by Cloudflare
}

// ── Encryption (AES-256-GCM) ────────────────────────────
// Uses dedicated TWO_FA_ENCRYPTION_KEY — MUST be set (no fallback)

function getEncryptionKey(): Buffer {
  const keySource = env.TWO_FA_ENCRYPTION_KEY
  if (!keySource) {
    throw new Error("TWO_FA_ENCRYPTION_KEY is required — set it in .env")
  }

  return createHmac("sha256", keySource)
    .update("smsok-2fa-encryption-key-v2")
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
