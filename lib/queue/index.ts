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
  batchQueue,
  campaignQueue,
  webhookQueue,
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
  type DlqJobData,
  type SmsJobResult,
  type WebhookJobResult,
  type QueueHealthInfo,
  type QueuesHealthResponse,
} from "./types"
export {
  createOtpWorker,
  createSingleWorker,
  createBatchWorker,
  createCampaignWorker,
  createWebhookWorker,
  createDlqWorker,
} from "./workers"
