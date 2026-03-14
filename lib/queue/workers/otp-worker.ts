/**
 * OTP Worker — highest priority, fastest processing.
 * Concurrency: 50 | Rate limit: 100/sec | Retry: 3x (1s, 2s, 4s)
 *
 * This runs in a SEPARATE PROCESS (not inside Next.js).
 * Start with: bun run workers/start.ts
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type SmsJobData, type SmsJobResult } from "../types"
import { maskPhoneForLog } from "../../log-masking"
import { logger } from "../../logger"

export function createOtpWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_OTP]

  const worker = new Worker<SmsJobData, SmsJobResult>(
    QUEUE_NAMES.SMS_OTP,
    async (job) => {
      const { recipients, message, sender, correlationId } = job.data

      const phone = recipients[0]
      if (!phone) {
        throw new Error("No recipient phone number")
      }

      // Import SMS gateway dynamically (worker process may not have Next.js context)
      const { sendSingleSms } = await import("../../sms-gateway")

      const result = await sendSingleSms(phone, message, sender)

      if (!result.success) {
        // Check for permanent failures — don't retry
        if (result.error?.includes("INVALID_NUMBER")) {
          throw new Error(`INVALID_NUMBER: ${result.error}`)
        }
        throw new Error(result.error || "SMS send failed")
      }

      logger.info("otp worker sent sms", {
        correlationId,
        phone: maskPhoneForLog(phone),
        jobId: job.id,
      })

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
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          // OTP: fast retries (1s, 2s, 4s) — time-critical
          return Math.min(1000 * Math.pow(2, attemptsMade - 1), 4000)
        },
      },
    }
  )

  worker.on("completed", (job) => {
    if (job) {
      logger.info("otp worker job completed", { jobId: job.id })
    }
  })

  worker.on("failed", (job, err) => {
    console.error(
      `[OTP Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`
    )
  })

  worker.on("error", (err) => {
    console.error("[OTP Worker] Error:", err.message)
  })

  return worker
}
