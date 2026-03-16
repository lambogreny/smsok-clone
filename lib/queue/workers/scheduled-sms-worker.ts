import { Worker } from "bullmq";
import { workerConnectionOptions } from "../connection";
import { QUEUE_CONFIG, QUEUE_NAMES, type SmsJobData, type SmsJobResult } from "../types";
import { logger } from "../../logger";

export function createScheduledSmsWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_SCHEDULED];

  const worker = new Worker<SmsJobData, SmsJobResult>(
    QUEUE_NAMES.SMS_SCHEDULED,
    async (job) => {
      const scheduledSmsId = job.data.scheduledSmsId;
      if (!scheduledSmsId) {
        throw new Error("scheduledSmsId is required");
      }

      const { processScheduledSmsJob } = await import("../../actions/scheduled-sms");
      return processScheduledSmsJob(scheduledSmsId);
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: config.rateLimit,
    },
  );

  worker.on("completed", (job) => {
    if (job) logger.info("scheduled sms worker job completed", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    console.error(`[Scheduled SMS Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  worker.on("error", (err) => {
    console.error("[Scheduled SMS Worker] Error:", err.message);
  });

  return worker;
}
