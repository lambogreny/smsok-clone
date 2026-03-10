import { createHmac, randomBytes } from "crypto"
import { prisma } from "./db"
import { safeFetch } from "./url-safety"
import { decryptSecret } from "./two-factor"

export type WebhookEvent =
  | "sms.sent"
  | "sms.delivered"
  | "sms.failed"
  | "otp.verified"
  | "credit.low"

const MAX_RETRIES = 3
const BACKOFF_BASE = 5 // seconds: 1s, 5s, 25s (5^0, 5^1, 5^2)
const DISPATCH_TIMEOUT = 10_000 // 10s
const MAX_RESPONSE_BYTES = 1024 * 1024 // 1MB response body limit

// ── Generate webhook secret ─────────────────────────────

export function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex")
}

// ── HMAC-SHA256 signing ─────────────────────────────────

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex")
}

// ── Dispatch event to all matching webhooks ─────────────

export async function dispatchWebhookEvent(
  userId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      active: true,
      events: { has: event },
    },
  })

  // Fire all dispatches concurrently (don't block caller)
  // Decrypt secrets before dispatch
  const promises = webhooks.map((webhook) => {
    let secret: string
    try {
      secret = decryptSecret(webhook.secret)
    } catch {
      // If decryption fails (legacy plaintext secret), use as-is
      secret = webhook.secret
    }
    return deliverWithRetry(webhook.id, webhook.url, secret, event, data)
  })

  // Don't await — fire and forget (caller shouldn't be blocked)
  Promise.allSettled(promises).catch(() => {})
}

// ── Deliver with retry (exponential backoff) ────────────

async function deliverWithRetry(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  const payload = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  })

  const signature = signPayload(payload, secret)

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 5s, 25s
      const delay = Math.pow(BACKOFF_BASE, attempt - 1) * 1000
      await sleep(delay)
    }

    const start = Date.now()
    let statusCode: number | null = null
    let responseBody: unknown = null
    let success = false

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT)

      // safeFetch: resolves DNS → validates IPs → fetches by IP (anti-rebinding)
      const res = await safeFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
          "X-Webhook-Delivery": randomBytes(16).toString("hex"),
        },
        body: payload,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      statusCode = res.status

      // Response body size limit (1MB) to prevent memory abuse
      try {
        const contentLength = parseInt(res.headers.get("content-length") ?? "0", 10)
        if (contentLength > MAX_RESPONSE_BYTES) {
          responseBody = `[truncated: response body exceeds ${MAX_RESPONSE_BYTES} bytes]`
        } else {
          const text = await res.text()
          responseBody = text.length > MAX_RESPONSE_BYTES
            ? text.slice(0, MAX_RESPONSE_BYTES) + "...[truncated]"
            : text
        }
      } catch {
        responseBody = null
      }

      success = res.ok // 2xx = success
    } catch (err) {
      responseBody = err instanceof Error ? err.message : "Unknown error"
      success = false

      // SSRF block — don't retry, log and exit immediately
      if (err instanceof Error && err.message.startsWith("SSRF blocked")) {
        const latency = Date.now() - start
        await prisma.webhookLog.create({
          data: {
            webhookId,
            event,
            payload: JSON.parse(payload),
            response: { body: String(responseBody) },
            statusCode: null,
            latency,
            success: false,
          },
        })
        return
      }
    }

    const latency = Date.now() - start

    // Log every attempt
    await prisma.webhookLog.create({
      data: {
        webhookId,
        event,
        payload: JSON.parse(payload),
        response: responseBody ? { body: String(responseBody) } : undefined,
        statusCode,
        latency,
        success,
      },
    })

    if (success) {
      // Reset fail count on success
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { failCount: 0 },
      })
      return
    }
  }

  // All retries failed — increment failCount
  await prisma.webhook.update({
    where: { id: webhookId },
    data: { failCount: { increment: 1 } },
  })

  // Auto-disable after 10 consecutive failures
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    select: { failCount: true },
  })
  if (webhook && webhook.failCount >= 10) {
    await prisma.webhook.update({
      where: { id: webhookId },
      data: { active: false },
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
