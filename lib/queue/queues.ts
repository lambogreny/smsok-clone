/**
 * BullMQ queues shared across the app.
 * Queues are created lazily (lazyConnect) and shared across the app.
 *
 * Usage: import { otpQueue } from '@/lib/queue/queues'
 *        await otpQueue.add('send-otp', jobData)
 */

import { Queue } from "bullmq"
import { producerConnectionOptions } from "./connection"
import {
  QUEUE_NAMES,
  RETRY_STRATEGIES,
  type SmsJobData,
  type WebhookJobData,
  type EmailJobData,
  type DlqJobData,
  type SlipVerificationJobData,
} from "./types"

// ── Queue Instances ─────────────────────────────────────

export const otpQueue = new Queue<SmsJobData>(QUEUE_NAMES.SMS_OTP, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    ...RETRY_STRATEGIES.otp,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

export const singleQueue = new Queue<SmsJobData>(QUEUE_NAMES.SMS_SINGLE, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    ...RETRY_STRATEGIES.single,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

export const batchQueue = new Queue<SmsJobData>(QUEUE_NAMES.SMS_BATCH, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    ...RETRY_STRATEGIES.batch,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
})

export const campaignQueue = new Queue<SmsJobData>(QUEUE_NAMES.SMS_CAMPAIGN, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    ...RETRY_STRATEGIES.campaign,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 1000 },
  },
})

export const webhookQueue = new Queue<WebhookJobData>(QUEUE_NAMES.SMS_WEBHOOK, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    ...RETRY_STRATEGIES.webhook,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    ...RETRY_STRATEGIES.email,
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 5000 },
  },
})

export const slipVerifyQueue = new Queue<SlipVerificationJobData>(QUEUE_NAMES.SLIP_VERIFY, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    ...RETRY_STRATEGIES.slipVerify,
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 604800 },
  },
})

export const dlqQueue = new Queue<DlqJobData>(QUEUE_NAMES.SMS_DLQ, {
  connection: producerConnectionOptions,
  defaultJobOptions: {
    removeOnComplete: false, // DLQ jobs kept for manual review
    removeOnFail: false,
  },
})

// ── All Queues (for health checks / monitoring) ─────────

export const allQueues = [
  otpQueue,
  singleQueue,
  batchQueue,
  campaignQueue,
  webhookQueue,
  emailQueue,
  slipVerifyQueue,
  dlqQueue,
] as const

// ── Cleanup ─────────────────────────────────────────────

export async function closeAllQueues() {
  await Promise.all(allQueues.map((q) => q.close()))
}
