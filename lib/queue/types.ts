/**
 * Shared job data types for BullMQ queues.
 * Used by both producers (API routes) and consumers (workers).
 */

// ── Queue Names ─────────────────────────────────────────

export const QUEUE_NAMES = {
  SMS_OTP: "sms-otp",
  SMS_SINGLE: "sms-single",
  SMS_BATCH: "sms-batch",
  SMS_CAMPAIGN: "sms-campaign",
  SMS_WEBHOOK: "sms-webhook",
  SMS_DLQ: "sms-dlq",
  EMAIL: "email",
  SLIP_VERIFY: "slip-verify",
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

// ── SMS Job Data ────────────────────────────────────────

export interface SmsJobData {
  id: string              // unique job reference (cuid)
  correlationId: string   // trace across services
  userId: string
  type: "otp" | "single" | "batch" | "campaign"

  // SMS content
  recipients: string[]    // phone numbers (normalized +66 format)
  message: string
  sender: string
  messageType: "thai" | "english"

  // Metadata
  campaignId?: string
  templateId?: string
  scheduledAt?: string    // ISO string
  priority?: number

  // Tracking
  attemptsMade?: number
  lastError?: string
}

// ── Webhook Job Data ────────────────────────────────────

export interface WebhookJobData {
  correlationId: string
  webhookId: string
  url: string
  event: string           // 'sms.sent' | 'sms.delivered' | 'sms.failed' | etc.
  payload: Record<string, unknown>
  secret: string          // HMAC signing key (decrypted)
  attempt: number
}

// ── Email Job Data ──────────────────────────────────────

export type EmailTemplate =
  | "welcome"
  | "verification"
  | "password_reset"
  | "invoice"
  | "credit_low"
  | "campaign_summary"
  | "security_alert"
  | "weekly_report"
  | "package_expiry"
  | "purchase_confirmation"

export interface EmailJobData {
  correlationId: string
  to: string | string[]
  template: EmailTemplate
  data: Record<string, unknown>
  userId?: string
  tags?: { name: string; value: string }[]
}

export interface EmailJobResult {
  resendId?: string
  success: boolean
}

// ── Slip Verification Job Data ──────────────────────────

export interface SlipVerificationJobData {
  orderId: string
  orderSlipId: string
  userId: string
  queuedAt: string
}

export interface SlipVerificationJobResult {
  status: "approved" | "rejected" | "manual_review" | "ignored"
  note: string
}

// ── DLQ Job Data ────────────────────────────────────────

export interface DlqJobData {
  originalQueue: string
  originalJobId: string | undefined
  data: SmsJobData | WebhookJobData | EmailJobData | SlipVerificationJobData
  error: string
  failedAt: string        // ISO string
  attempts: number
  category: "permanent" | "transient" | "unknown"
}

// ── Job Result ──────────────────────────────────────────

export interface SmsJobResult {
  smsId?: string
  providerMsgId?: string
  status: "sent" | "delivered" | "failed"
  creditCost?: number
}

export interface WebhookJobResult {
  statusCode: number | null
  success: boolean
  latency: number
}

// ── Queue Health ────────────────────────────────────────

export interface QueueHealthInfo {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: boolean
}

export interface QueuesHealthResponse {
  status: "healthy" | "degraded" | "down"
  redis: "connected" | "disconnected"
  queues: QueueHealthInfo[]
  timestamp: string
}

// ── Retry Strategies ────────────────────────────────────

export const RETRY_STRATEGIES = {
  otp: { attempts: 3, backoff: { type: "exponential" as const, delay: 1000 } },
  single: { attempts: 5, backoff: { type: "exponential" as const, delay: 2000 } },
  batch: { attempts: 5, backoff: { type: "exponential" as const, delay: 5000 } },
  campaign: { attempts: 8, backoff: { type: "exponential" as const, delay: 10000 } },
  webhook: { attempts: 3, backoff: { type: "exponential" as const, delay: 1000 } },
  email: { attempts: 3, backoff: { type: "exponential" as const, delay: 3000 } },
  slipVerify: { attempts: 5, backoff: { type: "slip-verify" as const, delay: 60000 } },
} as const

const SLIP_VERIFY_RETRY_DELAYS_MS = [60000, 180000, 300000, 420000] as const

export function getSlipVerifyRetryDelay(attemptsMade: number) {
  return SLIP_VERIFY_RETRY_DELAYS_MS[Math.max(0, attemptsMade - 1)] ?? SLIP_VERIFY_RETRY_DELAYS_MS.at(-1) ?? 420000
}

// ── Concurrency / Rate Limits ───────────────────────────

export const QUEUE_CONFIG = {
  [QUEUE_NAMES.SMS_OTP]: { concurrency: 50, rateLimit: { max: 100, duration: 1000 } },
  [QUEUE_NAMES.SMS_SINGLE]: { concurrency: 30, rateLimit: { max: 50, duration: 1000 } },
  [QUEUE_NAMES.SMS_BATCH]: { concurrency: 10, rateLimit: { max: 200, duration: 1000 } },
  [QUEUE_NAMES.SMS_CAMPAIGN]: { concurrency: 5, rateLimit: { max: 100, duration: 1000 } },
  [QUEUE_NAMES.SMS_WEBHOOK]: { concurrency: 20, rateLimit: { max: 50, duration: 1000 } },
  [QUEUE_NAMES.SMS_DLQ]: { concurrency: 3 },
  [QUEUE_NAMES.EMAIL]: { concurrency: 10, rateLimit: { max: 20, duration: 1000 } },
  [QUEUE_NAMES.SLIP_VERIFY]: { concurrency: 5 },
} as const
