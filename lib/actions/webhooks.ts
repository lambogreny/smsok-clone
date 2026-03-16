
import { prisma } from "@/lib/db"
import { resolveActionUserId } from "@/lib/action-user"
import { generateWebhookSecret, signPayload, type WebhookEvent } from "@/lib/webhook-dispatch"
import { isObviouslyInternalUrl, safeFetch } from "@/lib/url-safety"
import { encryptSecret, decryptSecret } from "@/lib/two-factor"
import { randomBytes } from "crypto"

export const VALID_EVENTS: WebhookEvent[] = [
  "sms.sent",
  "sms.delivered",
  "sms.failed",
  "sms.clicked",
  "otp.verified",
  "credit.low",
  "campaign.completed",
  "campaign.started",
  "campaign.failed",
  "contact.opted_out",
  "credits.depleted",
]

export const WEBHOOK_EVENT_REGISTRY = VALID_EVENTS.map((event) => {
  const [category, action] = event.split(".")
  return { event, category, action }
})

async function resolveWebhookUserId(apiUserId?: string) {
  return resolveActionUserId(apiUserId)
}

function maskWebhookSecret(secret: string) {
  if (secret.length <= 4) {
    return "••••"
  }

  return `••••••••${secret.slice(-4)}`
}

// ── List webhooks ───────────────────────────────────────

export async function listWebhooks(apiUserId?: string) {
  const userId = await resolveWebhookUserId(apiUserId)
  const user = { id: userId }

  const webhooks = await prisma.webhook.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      failCount: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return webhooks.map((w) => ({
    id: w.id,
    url: w.url,
    events: w.events,
    status: w.active ? "active" : "disabled",
    active: w.active,
    failCount: w.failCount,
    deliveryCount: w._count.logs,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }))
}

// ── Get webhook detail ──────────────────────────────────

export async function getWebhook(id: string, apiUserId?: string) {
  const userId = await resolveWebhookUserId(apiUserId)
  const user = { id: userId }

  const webhook = await prisma.webhook.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      url: true,
      events: true,
      secret: true,
      active: true,
      failCount: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { logs: true } },
    },
  })
  if (!webhook) throw new Error("ไม่พบ webhook")

  let plaintextSecret: string
  try {
    plaintextSecret = decryptSecret(webhook.secret)
  } catch {
    plaintextSecret = webhook.secret
  }

  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    status: webhook.active ? "active" : "disabled",
    secret: maskWebhookSecret(plaintextSecret),
    failCount: webhook.failCount,
    deliveryCount: webhook._count.logs,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
  }
}

// ── Create webhook ──────────────────────────────────────

export async function createWebhook(input: {
  url: string
  events: string[]
  userId?: string
}) {
  const userId = await resolveWebhookUserId(input.userId)
  const user = { id: userId }

  // Validate URL
  try {
    const parsed = new URL(input.url)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL ต้องเริ่มต้นด้วย http:// หรือ https://")
    }
  } catch {
    throw new Error("URL ไม่ถูกต้อง")
  }

  // SSRF protection — block internal/private URLs
  if (isObviouslyInternalUrl(input.url)) {
    throw new Error("ไม่สามารถใช้ URL ที่ชี้ไปยัง internal/private address ได้")
  }

  // Validate events
  if (!input.events.length) throw new Error("กรุณาเลือก event อย่างน้อย 1 รายการ")
  for (const event of input.events) {
    if (!VALID_EVENTS.includes(event as WebhookEvent)) {
      throw new Error(`Event "${event}" ไม่ถูกต้อง`)
    }
  }

  // Limit webhooks per user
  const count = await prisma.webhook.count({ where: { userId: user.id } })
  if (count >= 10) throw new Error("สร้าง webhook ได้สูงสุด 10 รายการ")

  const secret = generateWebhookSecret()
  const encryptedSecret = encryptSecret(secret)

  const webhook = await prisma.webhook.create({
    data: {
      userId: user.id,
      url: input.url,
      events: input.events,
      secret: encryptedSecret,
    },
    select: {
      id: true,
      url: true,
      events: true,
      secret: true,
      active: true,
      createdAt: true,
    },
  })

  // Return plaintext secret only on creation (one-time display)
  return { ...webhook, secret }
}

// ── Update webhook ──────────────────────────────────────

export async function updateWebhook(
  id: string,
  input: { url?: string; events?: string[]; active?: boolean },
  apiUserId?: string
) {
  const userId = await resolveWebhookUserId(apiUserId)
  const user = { id: userId }

  // Verify ownership
  const webhook = await prisma.webhook.findFirst({
    where: { id, userId: user.id },
  })
  if (!webhook) throw new Error("ไม่พบ webhook")

  // Validate URL if provided
  if (input.url) {
    try {
      const parsed = new URL(input.url)
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("URL ต้องเริ่มต้นด้วย http:// หรือ https://")
      }
    } catch {
      throw new Error("URL ไม่ถูกต้อง")
    }

    // SSRF protection
    if (isObviouslyInternalUrl(input.url)) {
      throw new Error("ไม่สามารถใช้ URL ที่ชี้ไปยัง internal/private address ได้")
    }
  }

  // Validate events if provided
  if (input.events) {
    if (!input.events.length) throw new Error("กรุณาเลือก event อย่างน้อย 1 รายการ")
    for (const event of input.events) {
      if (!VALID_EVENTS.includes(event as WebhookEvent)) {
        throw new Error(`Event "${event}" ไม่ถูกต้อง`)
      }
    }
  }

  const updated = await prisma.webhook.update({
    where: { id },
    data: {
      ...(input.url && { url: input.url }),
      ...(input.events && { events: input.events }),
      ...(input.active !== undefined && { active: input.active }),
      // Reset fail count when reactivating
      ...(input.active === true && { failCount: 0 }),
    },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      failCount: true,
      updatedAt: true,
    },
  })

  return updated
}

// ── Delete webhook ──────────────────────────────────────

export async function deleteWebhook(id: string, apiUserId?: string) {
  const userId = await resolveWebhookUserId(apiUserId)
  const user = { id: userId }

  const webhook = await prisma.webhook.findFirst({
    where: { id, userId: user.id },
  })
  if (!webhook) throw new Error("ไม่พบ webhook")

  // Cascade delete logs (defined in schema)
  await prisma.webhook.delete({ where: { id } })

  return { success: true }
}

// ── Test webhook ────────────────────────────────────────

export async function testWebhook(id: string, apiUserId?: string) {
  const userId = await resolveWebhookUserId(apiUserId)
  const user = { id: userId }

  const webhook = await prisma.webhook.findFirst({
    where: { id, userId: user.id },
  })
  if (!webhook) throw new Error("ไม่พบ webhook")

  const samplePayload = JSON.stringify({
    event: "test",
    data: {
      message: "This is a test webhook delivery",
      webhookId: webhook.id,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  })

  // Decrypt secret for signing
  let plaintextSecret: string
  try {
    plaintextSecret = decryptSecret(webhook.secret)
  } catch {
    // Legacy plaintext secret or key mismatch — use as-is
    plaintextSecret = webhook.secret
  }
  const signature = signPayload(samplePayload, plaintextSecret)
  const start = Date.now()
  let statusCode: number | null = null
  let responseBody: unknown = null
  let success = false

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    // safeFetch: DNS resolve → IP validation → fetch by IP (anti-rebinding + SSRF)
    const res = await safeFetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": "test",
        "X-Webhook-Delivery": randomBytes(16).toString("hex"),
      },
      body: samplePayload,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    statusCode = res.status

    try {
      responseBody = await res.text()
    } catch {
      responseBody = null
    }

    success = res.ok
  } catch (err) {
    responseBody = err instanceof Error ? err.message : "Unknown error"
    success = false
  }

  const latency = Date.now() - start

  // Log test delivery
  await prisma.webhookLog.create({
    data: {
      webhookId: webhook.id,
      event: "test",
      payload: JSON.parse(samplePayload),
      response: responseBody ? { body: String(responseBody) } : undefined,
      statusCode,
      latency,
      success,
    },
  })

  return {
    success,
    statusCode,
    latencyMs: latency,
    url: webhook.url,
    event: "test",
    response: responseBody ? String(responseBody).slice(0, 1000) : null,
  }
}

// ── Rotate webhook secret ───────────────────────────────

export async function rotateWebhookSecret(id: string, apiUserId?: string) {
  const userId = await resolveWebhookUserId(apiUserId)
  const user = { id: userId }

  const webhook = await prisma.webhook.findFirst({
    where: { id, userId: user.id },
  })
  if (!webhook) throw new Error("ไม่พบ webhook")

  const newSecret = generateWebhookSecret()
  const encryptedSecret = encryptSecret(newSecret)

  await prisma.webhook.update({
    where: { id },
    data: { secret: encryptedSecret },
  })

  // Return new secret only once (one-time display)
  return { id, secret: newSecret }
}

// ── Get webhook logs ────────────────────────────────────

export async function getWebhookLogs(
  webhookId: string,
  options: { page?: number; limit?: number } = {},
  apiUserId?: string
) {
  const userId = await resolveWebhookUserId(apiUserId)
  const user = { id: userId }

  // Verify ownership
  const webhook = await prisma.webhook.findFirst({
    where: { id: webhookId, userId: user.id },
    select: { id: true },
  })
  if (!webhook) throw new Error("ไม่พบ webhook")

  const page = options.page ?? 1
  const limit = Math.min(options.limit ?? 20, 100)
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        event: true,
        payload: true,
        response: true,
        statusCode: true,
        latency: true,
        success: true,
        createdAt: true,
      },
    }),
    prisma.webhookLog.count({ where: { webhookId } }),
  ])

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}
