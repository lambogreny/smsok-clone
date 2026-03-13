import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const queueTypesSource = readFileSync(resolve(ROOT, "lib/queue/types.ts"), "utf-8");
const queuesSource = readFileSync(resolve(ROOT, "lib/queue/queues.ts"), "utf-8");
const queueIndexSource = readFileSync(resolve(ROOT, "lib/queue/index.ts"), "utf-8");
const adminQueuesRouteSource = readFileSync(resolve(ROOT, "app/api/admin/queues/route.ts"), "utf-8");
const workerSource = readFileSync(
  resolve(ROOT, "lib/queue/workers/slip-verification-worker.ts"),
  "utf-8",
);
const workersStartSource = readFileSync(resolve(ROOT, "workers/start.ts"), "utf-8");
const slipRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");
const slipVerificationSource = readFileSync(
  resolve(ROOT, "lib/orders/slip-verification.ts"),
  "utf-8",
);

describe("Task #2829: slip verification runs via BullMQ worker", () => {
  it("defines a dedicated slip verification queue with the required retry cadence", () => {
    expect(queueTypesSource).toContain('SLIP_VERIFY: "slip-verify"');
    expect(queueTypesSource).toContain('slipVerify: { attempts: 5, backoff: { type: "slip-verify" as const, delay: 60000 } }');
    expect(queueTypesSource).toContain("const SLIP_VERIFY_RETRY_DELAYS_MS = [60000, 180000, 300000, 420000] as const");
  });

  it("exports the queue and surfaces it in Bull Board + worker startup", () => {
    expect(queuesSource).toContain("export const slipVerifyQueue = new Queue<SlipVerificationJobData>");
    expect(queueIndexSource).toContain("slipVerifyQueue");
    expect(adminQueuesRouteSource).toContain("new BullMQAdapter(slipVerifyQueue)");
    expect(workersStartSource).toContain("createSlipVerificationWorker()");
  });

  it("queues order slip uploads instead of verifying them inside the request handler", () => {
    expect(slipRouteSource).toContain("slipVerifyQueue.add");
    expect(slipRouteSource).toContain('status: "VERIFYING"');
    expect(slipRouteSource).toContain("SLIP_QUEUED_STATUS_NOTE");
    expect(slipRouteSource).toContain('pending_review: false');
    expect(slipRouteSource).not.toContain("verifySlip(slipBlob");
  });

  it("keeps the verification rules in the worker service with a hard timeout and manual-review fallback", () => {
    expect(slipVerificationSource).toContain("const SLIP_VERIFY_TIMEOUT_MS = 30_000");
    expect(slipVerificationSource).toContain("withTimeout(verifySlip(slipBlob), SLIP_VERIFY_TIMEOUT_MS");
    expect(slipVerificationSource).toContain("markQueuedOrderForManualReview");
    expect(slipVerificationSource).toContain("SLIP_RETRY_EXHAUSTED_NOTE");
    expect(slipVerificationSource).toContain("activateOrderPurchase");
    expect(slipVerificationSource).toContain("ensureOrderDocument");
  });

  it("sends exhausted jobs to DLQ after moving the order into manual review", () => {
    expect(workerSource).toContain("getSlipVerifyRetryDelay");
    expect(workerSource).toContain("markQueuedOrderForManualReview");
    expect(workerSource).toContain('await dlqQueue.add("slip-verification-failed"');
    expect(workerSource).toContain('originalQueue: QUEUE_NAMES.SLIP_VERIFY');
  });
});
