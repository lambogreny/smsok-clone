/**
 * Batch SMS Worker — splits multi-recipient jobs into individual sms-single queue jobs.
 * Concurrency: 10 | Rate limit: 200/sec | Retry: 5x exponential
 *
 * Instead of sending directly, creates individual jobs in sms-single queue
 * for better retry handling and progress tracking per recipient.
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type SmsJobData, type SmsJobResult } from "../types"
import { singleQueue } from "../queues"
import { randomBytes } from "crypto"
import { logger } from "../../logger"

const CHUNK_SIZE = 50

export function createBatchWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_BATCH]

  const worker = new Worker<SmsJobData, SmsJobResult>(
    QUEUE_NAMES.SMS_BATCH,
    async (job) => {
      const { recipients, message, sender, correlationId, userId, type, messageType } = job.data

      if (recipients.length === 0) {
        throw new Error("No recipients")
      }

      let dispatched = 0

      // Split into individual jobs in sms-single queue
      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + CHUNK_SIZE)

        const jobs = chunk.map((phone) => ({
          name: "single-from-batch",
          data: {
            id: randomBytes(12).toString("hex"),
            correlationId,
            userId,
            type: "single" as const,
            recipients: [phone],
            message,
            sender,
            messageType,
          },
        }))

        await singleQueue.addBulk(jobs)
        dispatched += chunk.length

        // Update progress
        await job.updateProgress(Math.round((dispatched / recipients.length) * 100))
      }

      logger.info("batch worker dispatched jobs", {
        correlationId,
        dispatched,
        jobId: job.id,
      })

      return {
        smsId: job.data.id,
        status: "sent" as const,
        creditCost: dispatched,
      }
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: config.rateLimit,
    }
  )

  worker.on("completed", (job) => {
    if (job) logger.info("batch worker job completed", { jobId: job.id })
  })

  worker.on("failed", (job, err) => {
    console.error(`[Batch Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  })

  worker.on("error", (err) => {
    console.error("[Batch Worker] Error:", err.message)
  })

  return worker
}
