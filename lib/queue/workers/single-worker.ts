/**
 * Single SMS Worker — standard priority.
 * Concurrency: 30 | Rate limit: 50/sec | Retry: 5x exponential
 *
 * Updates Message status in DB + dispatches webhook events on status change.
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type SmsJobData, type SmsJobResult } from "../types"
import { prisma } from "../../db"
import { dispatchWebhookEvent } from "../../webhook-dispatch"
import { maskPhoneForLog } from "../../log-masking"

export function createSingleWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_SINGLE]

  const worker = new Worker<SmsJobData, SmsJobResult>(
    QUEUE_NAMES.SMS_SINGLE,
    async (job) => {
      const { id, recipients, message, sender, correlationId, userId } = job.data

      const phone = recipients[0]
      if (!phone) {
        throw new Error("No recipient phone number")
      }

      const { sendSingleSms } = await import("../../sms-gateway")
      const result = await sendSingleSms(phone, message, sender)

      if (!result.success) {
        // Update message status to failed
        if (id) {
          await prisma.message.update({
            where: { id },
            data: { status: "failed", errorCode: result.error || "SEND_FAILED" },
          }).catch((err) => { console.error(`[Single Worker] Failed to update message status to failed: messageId=${id}`, err); throw err })
        }

        // Dispatch webhook for failure
        dispatchWebhookEvent(userId, "sms.failed", {
          messageId: id,
          phone,
          error: result.error,
          correlationId,
        })

        // Permanent failure — don't retry
        if (result.error?.includes("INVALID_NUMBER")) {
          throw new Error(`INVALID_NUMBER: ${result.error}`)
        }
        throw new Error(result.error || "SMS send failed")
      }

      // Update message status to sent
      if (id) {
        await prisma.message.update({
          where: { id },
          data: {
            status: "sent",
            sentAt: new Date(),
            gatewayId: result.jobId || null,
          },
        }).catch((err) => { console.error(`[Single Worker] Failed to update message status to sent: messageId=${id}`, err); throw err })
      }

      // Dispatch webhook for success
      dispatchWebhookEvent(userId, "sms.sent", {
        messageId: id,
        phone,
        providerMsgId: result.jobId,
        correlationId,
      })

      console.log(
        `[Single Worker] ✓ correlationId=${correlationId} phone=${maskPhoneForLog(phone)} jobId=${job.id}`
      )

      return {
        smsId: id,
        providerMsgId: result.jobId,
        status: "sent" as const,
        creditCost: 1,
      }
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: config.rateLimit,
    }
  )

  worker.on("completed", (job) => {
    if (job) console.log(`[Single Worker] Job ${job.id} completed`)
  })

  worker.on("failed", (job, err) => {
    console.error(`[Single Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  })

  worker.on("error", (err) => {
    console.error("[Single Worker] Error:", err.message)
  })

  return worker
}
