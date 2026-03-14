/**
 * Webhook Worker — delivers webhook events via queue (replaces fire-and-forget).
 * Concurrency: 20 | Rate limit: 50/sec | Retry: 5x exponential (30s base)
 *
 * Uses safeFetch for SSRF + DNS rebinding protection.
 * Logs every attempt to WebhookLog. Auto-disables after 10 consecutive failures.
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type WebhookJobData, type WebhookJobResult } from "../types"
import { prisma } from "../../db"
import { logger } from "../../logger"

const MAX_RESPONSE_BYTES = 1024 * 1024

export function createWebhookWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_WEBHOOK]

  const worker = new Worker<WebhookJobData, WebhookJobResult>(
    QUEUE_NAMES.SMS_WEBHOOK,
    async (job) => {
      const { webhookId, url, secret, event, payload, correlationId } = job.data

      const { safeFetch } = await import("../../url-safety")
      const { createHmac, randomBytes } = await import("crypto")

      const body = JSON.stringify({
        event,
        data: payload,
        timestamp: new Date().toISOString(),
      })

      const signature = createHmac("sha256", secret).update(body).digest("hex")

      const start = Date.now()
      let statusCode: number | null = null
      let responseBody: string | null = null
      let success = false

      try {
        const res = await safeFetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
            "X-Webhook-Delivery": randomBytes(16).toString("hex"),
          },
          body,
          signal: AbortSignal.timeout(10_000),
        })

        statusCode = res.status
        success = res.ok

        // Read response body with size limit
        try {
          const text = await res.text()
          responseBody = text.length > MAX_RESPONSE_BYTES
            ? text.slice(0, MAX_RESPONSE_BYTES) + "...[truncated]"
            : text
        } catch {
          responseBody = null
        }
      } catch (err) {
        responseBody = err instanceof Error ? err.message : "Unknown error"
      }

      const latency = Date.now() - start

      // Log attempt to WebhookLog
      await prisma.webhookLog.create({
        data: {
          webhookId,
          event,
          payload: JSON.parse(body),
          response: responseBody ? { body: responseBody } : undefined,
          statusCode,
          latency,
          success,
        },
      }).catch((err) => console.error(`[Webhook Worker] Failed to log delivery: webhookId=${webhookId}`, err))

      if (success) {
        // Reset fail count on success
        await prisma.webhook.update({
          where: { id: webhookId },
          data: { failCount: 0 },
        }).catch((err) => console.error(`[Webhook Worker] Failed to reset failCount: webhookId=${webhookId}`, err))

        logger.info("webhook worker delivered event", {
          correlationId,
          event,
          statusCode,
          latency,
          jobId: job.id,
        })

        return { statusCode, success: true, latency }
      }

      // Increment fail count
      const webhook = await prisma.webhook.update({
        where: { id: webhookId },
        data: { failCount: { increment: 1 } },
        select: { failCount: true },
      }).catch((err) => { console.error(`[Webhook Worker] Failed to increment failCount: webhookId=${webhookId}`, err); return null })

      // Auto-disable after 10 consecutive failures
      if (webhook && webhook.failCount >= 10) {
        await prisma.webhook.update({
          where: { id: webhookId },
          data: { active: false },
        }).catch((err) => console.error(`[Webhook Worker] Failed to auto-disable: webhookId=${webhookId}`, err))
        console.warn(`[Webhook Worker] ⚠ Webhook ${webhookId} auto-disabled after ${webhook.failCount} failures`)
      }

      throw new Error(`Webhook delivery failed: HTTP ${statusCode}`)
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: config.rateLimit,
    }
  )

  worker.on("completed", (job) => {
    if (job) logger.info("webhook worker job completed", { jobId: job.id })
  })

  worker.on("failed", (job, err) => {
    console.error(`[Webhook Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  })

  worker.on("error", (err) => {
    console.error("[Webhook Worker] Error:", err.message)
  })

  return worker
}
