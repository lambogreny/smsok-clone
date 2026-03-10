/**
 * Single SMS Worker — standard priority.
 * Concurrency: 30 | Rate limit: 50/sec | Retry: 5x exponential
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type SmsJobData, type SmsJobResult } from "../types"

export function createSingleWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_SINGLE]

  const worker = new Worker<SmsJobData, SmsJobResult>(
    QUEUE_NAMES.SMS_SINGLE,
    async (job) => {
      const { recipients, message, sender, correlationId } = job.data

      const phone = recipients[0]
      if (!phone) {
        throw new Error("No recipient phone number")
      }

      const { sendSingleSms } = await import("../../sms-gateway")
      const result = await sendSingleSms(phone, message, sender)

      if (!result.success) {
        if (result.error?.includes("INVALID_NUMBER")) {
          throw new Error(`INVALID_NUMBER: ${result.error}`)
        }
        throw new Error(result.error || "SMS send failed")
      }

      console.log(
        `[Single Worker] ✓ correlationId=${correlationId} phone=${phone} jobId=${job.id}`
      )

      return {
        smsId: job.data.id,
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
