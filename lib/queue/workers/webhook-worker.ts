/**
 * Webhook Worker — delivers webhook events.
 * Concurrency: 20 | Rate limit: 50/sec | Retry: 5x exponential (30s base)
 *
 * Uses safeFetch for SSRF + DNS rebinding protection.
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type WebhookJobData, type WebhookJobResult } from "../types"

export function createWebhookWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_WEBHOOK]

  const worker = new Worker<WebhookJobData, WebhookJobResult>(
    QUEUE_NAMES.SMS_WEBHOOK,
    async (job) => {
      const { url, secret, event, payload, correlationId } = job.data

      const { safeFetch } = await import("../../url-safety")
      const { createHmac, randomBytes } = await import("crypto")

      const body = JSON.stringify({
        event,
        data: payload,
        timestamp: new Date().toISOString(),
      })

      const signature = createHmac("sha256", secret).update(body).digest("hex")

      const start = Date.now()

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

      const latency = Date.now() - start
      const success = res.ok

      if (!success) {
        throw new Error(`Webhook delivery failed: HTTP ${res.status}`)
      }

      console.log(
        `[Webhook Worker] ✓ correlationId=${correlationId} event=${event} status=${res.status} latency=${latency}ms jobId=${job.id}`
      )

      return {
        statusCode: res.status,
        success: true,
        latency,
      }
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: config.rateLimit,
    }
  )

  worker.on("completed", (job) => {
    if (job) console.log(`[Webhook Worker] Job ${job.id} completed`)
  })

  worker.on("failed", (job, err) => {
    console.error(`[Webhook Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  })

  worker.on("error", (err) => {
    console.error("[Webhook Worker] Error:", err.message)
  })

  return worker
}
