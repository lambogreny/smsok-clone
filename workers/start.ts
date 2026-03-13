/**
 * Worker process entry point — runs OUTSIDE Next.js.
 * Start with: bun run workers:start
 *
 * Creates all workers and handles graceful shutdown.
 */

import { createOtpWorker } from "../lib/queue/workers/otp-worker"
import { createSingleWorker } from "../lib/queue/workers/single-worker"
import { createBatchWorker } from "../lib/queue/workers/batch-worker"
import { createCampaignWorker } from "../lib/queue/workers/campaign-worker"
import { createWebhookWorker } from "../lib/queue/workers/webhook-worker"
import { createSlipVerificationWorker } from "../lib/queue/workers/slip-verification-worker"
import { createDlqWorker } from "../lib/queue/workers/dlq-worker"

console.log("🚀 Starting SMSOK workers...")

const workers = [
  createOtpWorker(),
  createSingleWorker(),
  createBatchWorker(),
  createCampaignWorker(),
  createWebhookWorker(),
  createSlipVerificationWorker(),
  createDlqWorker(),
]

console.log(`✅ ${workers.length} workers running:`)
for (const w of workers) {
  console.log(`   - ${w.name}`)
}

// ── Graceful Shutdown ─────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`\n⏳ ${signal} received — shutting down workers...`)

  await Promise.allSettled(
    workers.map(async (w) => {
      try {
        await w.close()
        console.log(`   ✓ ${w.name} closed`)
      } catch (err) {
        console.error(`   ✗ ${w.name} error:`, err)
      }
    })
  )

  console.log("👋 All workers stopped.")
  process.exit(0)
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
