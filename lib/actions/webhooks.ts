
import { prisma } from "@/lib/db"
import { resolveActionUserId } from "@/lib/action-user"
import { generateWebhookSecret, signPayload, type WebhookEvent } from "@/lib/webhook-dispatch"
import { isObviouslyInternalUrl, safeFetch } from "@/lib/url-safety"
import { encryptSecret, decryptSecret } from "@/lib/two-factor"
import { ALL_EVENT_IDS, WEBHOOK_EVENT_REGISTRY } from "@/lib/webhook-events"
import { randomBytes } from "crypto"
import { z } from "zod"

type WebhookSummaryRecord = {
  id: string
  url: string
  events: string[]
  active: boolean
  failCount: number
  createdAt: Date
  updatedAt: Date
  _count: { logs: number }
}

const webhookLogsPaginationSchema = z.object({
  page: z.coerce.number().catch(1).transform((value) => Math.min(10_000, Math.max(1, Math.trunc(value)))),
  limit: z.coerce.number().catch(20).transform((value) => Math.min(100, Math.max(1, Math.trunc(value)))),
})

export const VALID_EVENTS: WebhookEvent[] = [...ALL_EVENT_IDS] as WebhookEvent[]

async function resolveWebhookUserId(apiUserId?: string) {
  return resolveActionUserId(apiUserId)
}

function maskWebhookSecret(secret: string) {
  if (secret.length <= 4) {
    return "••••"
  }

  return `••••••••${secret.slice(-4)}`
}

function calculateSuccessRate(successCount: number, deliveryCount: number) {
  if (deliveryCount === 0) {
    return 0
  }

  return Math.round((successCount / deliveryCount) * 10000) / 100
}

async function getWebhookLogStats(webhookIds: string[]) {
  if (webhookIds.length === 0) {
    return {
      successCountByWebhookId: new Map<string, number>(),
      lastDeliveryAtByWebhookId: new Map<string, Date | null>(),
    }
  }

  const [successCounts, lastDeliveries] = await Promise.all([
    prisma.webhookLog.groupBy({
      by: ["webhookId"],
      where: {
        webhookId: { in: webhookIds },
        success: true,
      },
      _count: { _all: true },
    }),
    prisma.webhookLog.groupBy({
      by: ["webhookId"],
      where: {
        webhookId: { in: webhookIds },
      },
      _max: { createdAt: true },
    }),
  ])

  return {
    successCountByWebhookId: new Map<string, number>(
      successCounts.map((row: (typeof successCounts)[number]) => [row.webhookId, row._count._all] as [string, number]),
    ),
    lastDeliveryAtByWebhookId: new Map<string, Date | null>(
      lastDeliveries.map((row: (typeof lastDeliveries)[number]) => [row.webhookId, row._max.createdAt ?? null] as [string, Date | null]),
    ),
  }
}

function buildWebhookSummary(
  webhook: WebhookSummaryRecord,
  successCountByWebhookId: Map<string, number>,
  lastDeliveryAtByWebhookId: Map<string, Date | null>,
) {
  const deliveryCount = webhook._count.logs
  const successCount = successCountByWebhookId.get(webhook.id) ?? 0

  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    eventCount: webhook.events.length,
    status: webhook.active ? "active" : "disabled",
    active: webhook.active,
    failCount: webhook.failCount,
    deliveryCount,
    successRate: calculateSuccessRate(successCount, deliveryCount),
    lastDeliveryAt: lastDeliveryAtByWebhookId.get(webhook.id) ?? null,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
  }
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

  const { successCountByWebhookId, lastDeliveryAtByWebhookId } = await getWebhookLogStats(
    webhooks.map((webhook: (typeof webhooks)[number]) => webhook.id),
  )

  return webhooks.map((webhook: (typeof webhooks)[number]) =>
    buildWebhookSummary(webhook, successCountByWebhookId, lastDeliveryAtByWebhookId),
  )
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
  const { successCountByWebhookId, lastDeliveryAtByWebhookId } = await getWebhookLogStats([webhook.id])

  let plaintextSecret: string
  try {
    plaintextSecret = decryptSecret(webhook.secret)
  } catch {
    plaintextSecret = webhook.secret
  }

  return {
    ...buildWebhookSummary(webhook, successCountByWebhookId, lastDeliveryAtByWebhookId),
    secret: maskWebhookSecret(plaintextSecret),
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
    latency,
    latencyMs: latency,
    url: webhook.url,
    event: "test",
    responseBody: responseBody ? String(responseBody).slice(0, 1000) : null,
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

  const { page, limit } = webhookLogsPaginationSchema.parse(options)
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

  return {
    logs: logs.map((log: (typeof logs)[number]) => {
      const responseRecord =
        log.response && typeof log.response === "object" && !Array.isArray(log.response)
          ? log.response as Record<string, unknown>
          : null

      return {
        id: log.id,
        event: log.event,
        statusCode: log.statusCode,
        latency: log.latency,
        success: log.success,
        createdAt: log.createdAt,
        payload: log.payload,
        response: log.response,
        requestBody: log.payload,
        responseBody: responseRecord?.body ?? log.response ?? null,
      }
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}
