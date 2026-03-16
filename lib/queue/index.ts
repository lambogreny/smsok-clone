/**
 * Queue system barrel export.
 * Import from '@/lib/queue' for queue access.
 *
 * Producers (Next.js app): import queues to add jobs
 * Workers (separate process): import from workers/ to create consumers
 */

export { producerConnectionOptions, workerConnectionOptions } from "./connection"
export {
  otpQueue,
  singleQueue,
  scheduledQueue,
  batchQueue,
  campaignQueue,
  webhookQueue,
  slipVerifyQueue,
  dlqQueue,
  allQueues,
  closeAllQueues,
} from "./queues"
export {
  QUEUE_NAMES,
  QUEUE_CONFIG,
  RETRY_STRATEGIES,
  type SmsJobData,
  type WebhookJobData,
  type SlipVerificationJobData,
  type SlipVerificationJobResult,
  type DlqJobData,
  type SmsJobResult,
  type WebhookJobResult,
  type QueueHealthInfo,
  type QueuesHealthResponse,
  getSlipVerifyRetryDelay,
} from "./types"
export {
  createOtpWorker,
  createSingleWorker,
  createScheduledSmsWorker,
  createBatchWorker,
  createCampaignWorker,
  createWebhookWorker,
  createSlipVerificationWorker,
  createDlqWorker,
} from "./workers"
