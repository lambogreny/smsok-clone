/**
 * DLQ (Dead Letter Queue) Worker — handles permanently failed jobs.
 * Concurrency: 3 | No rate limit | No retry
 *
 * Logs failed jobs for manual review. Does NOT auto-retry.
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type DlqJobData } from "../types"

export function createDlqWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_DLQ]

  const worker = new Worker<DlqJobData>(
    QUEUE_NAMES.SMS_DLQ,
    async (job) => {
      const { originalQueue, originalJobId, error, failedAt, attempts, category } = job.data

      // Log for manual review — DLQ jobs are kept in Redis (removeOnComplete: false)
      console.warn(
        `[DLQ] ⚠ originalQueue=${originalQueue} originalJobId=${originalJobId} category=${category} attempts=${attempts} error="${error}" failedAt=${failedAt}`
      )

      // Future: write to DB audit table, send alert to Slack/email
      // For now, the job stays in Redis for manual inspection via BullMQ dashboard
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
    }
  )

  worker.on("error", (err) => {
    console.error("[DLQ Worker] Error:", err.message)
  })

  return worker
}
