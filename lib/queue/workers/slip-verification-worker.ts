import { Worker } from "bullmq";
import { workerConnectionOptions } from "../connection";
import {
  QUEUE_CONFIG,
  QUEUE_NAMES,
  getSlipVerifyRetryDelay,
  type SlipVerificationJobData,
  type SlipVerificationJobResult,
} from "../types";
import { dlqQueue } from "../queues";
import {
  markQueuedOrderForManualReview,
  processQueuedOrderSlipVerification,
} from "@/lib/orders/slip-verification";

export function createSlipVerificationWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SLIP_VERIFY];

  const worker = new Worker<SlipVerificationJobData, SlipVerificationJobResult>(
    QUEUE_NAMES.SLIP_VERIFY,
    async (job) => processQueuedOrderSlipVerification(job.data),
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      settings: {
        backoffStrategy(attemptsMade, type) {
          if (type === "slip-verify") {
            return getSlipVerifyRetryDelay(attemptsMade);
          }
          return 0;
        },
      },
    },
  );

  worker.on("completed", (job, result) => {
    console.log(`[Slip Worker] Job ${job.id} completed: ${result?.status ?? "unknown"}`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[Slip Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);

    if (!job) return;

    const attempts = typeof job.opts.attempts === "number" ? job.opts.attempts : 1;
    if (job.attemptsMade < attempts) return;

    await markQueuedOrderForManualReview({
      orderId: job.data.orderId,
      orderSlipId: job.data.orderSlipId,
      errorMessage: `Slip verification retries exhausted: ${err.message}`,
    }).catch((manualReviewError) => {
      console.error("[Slip Worker] Failed to mark order for manual review:", manualReviewError);
    });

    await dlqQueue.add("slip-verification-failed", {
      originalQueue: QUEUE_NAMES.SLIP_VERIFY,
      originalJobId: job.id?.toString(),
      data: job.data,
      error: err.message,
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade,
      category: "transient",
    }).catch((dlqError) => {
      console.error("[Slip Worker] Failed to enqueue DLQ record:", dlqError);
    });
  });

  worker.on("error", (err) => {
    console.error("[Slip Worker] Error:", err.message);
  });

  return worker;
}
