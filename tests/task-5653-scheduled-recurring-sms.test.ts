import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const scheduleAliasRoute = readFileSync(resolve(ROOT, "app/api/v1/sms/schedule/route.ts"), "utf-8");
const recurringRoute = readFileSync(resolve(ROOT, "app/api/v1/sms/recurring/route.ts"), "utf-8");
const scheduledDeleteRoute = readFileSync(resolve(ROOT, "app/api/v1/sms/scheduled/[id]/route.ts"), "utf-8");
const scheduledActions = readFileSync(resolve(ROOT, "lib/actions/scheduled-sms.ts"), "utf-8");
const schedulingActions = readFileSync(resolve(ROOT, "lib/actions/scheduling.ts"), "utf-8");
const validationsSource = readFileSync(resolve(ROOT, "lib/validations.ts"), "utf-8");
const queueTypesSource = readFileSync(resolve(ROOT, "lib/queue/types.ts"), "utf-8");
const queuesSource = readFileSync(resolve(ROOT, "lib/queue/queues.ts"), "utf-8");
const workersIndexSource = readFileSync(resolve(ROOT, "lib/queue/workers/index.ts"), "utf-8");
const scheduledWorkerSource = readFileSync(resolve(ROOT, "lib/queue/workers/scheduled-sms-worker.ts"), "utf-8");
const adminQueuesRoute = readFileSync(resolve(ROOT, "app/api/admin/queues/route.ts"), "utf-8");

describe("Task #5653: scheduled and recurring SMS backend", () => {
  it("adds the schedule alias route to reuse the existing scheduled SMS creation contract", () => {
    expect(scheduleAliasRoute).toContain('export { POST } from "../scheduled/route"');
  });

  it("adds recurring SMS route validation and reuses the campaign repeat scheduler", () => {
    expect(validationsSource).toContain("export const recurringSmsCreateSchema");
    expect(recurringRoute).toContain("recurringSmsCreateSchema.parse");
    expect(recurringRoute).toContain("scheduleCampaign(user.id");
    expect(recurringRoute).toContain('requireApiPermission(user.id, "create", "sms")');
  });

  it("supports RESTful cancellation via DELETE /api/v1/sms/scheduled/:id", () => {
    expect(scheduledDeleteRoute).toContain("async function DELETE");
    expect(scheduledDeleteRoute).toContain("cancelScheduledSms");
  });

  it("registers a dedicated BullMQ queue and worker for scheduled SMS jobs", () => {
    expect(queueTypesSource).toContain('SMS_SCHEDULED: "sms-scheduled"');
    expect(queueTypesSource).toContain('scheduledSmsId?: string');
    expect(queuesSource).toContain("export const scheduledQueue");
    expect(workersIndexSource).toContain('export { createScheduledSmsWorker } from "./scheduled-sms-worker"');
    expect(scheduledWorkerSource).toContain("QUEUE_NAMES.SMS_SCHEDULED");
    expect(adminQueuesRoute).toContain("new BullMQAdapter(scheduledQueue)");
  });

  it("enqueues scheduled SMS records onto BullMQ and exposes a single-record worker path", () => {
    expect(scheduledActions).toContain("enqueueScheduledSmsJob");
    expect(scheduledActions).toContain("removeScheduledSmsJob");
    expect(scheduledActions).toContain("export async function processScheduledSmsJob");
    expect(scheduledActions).toContain("await enqueueScheduledSmsJob(scheduled)");
    expect(scheduledActions).toContain("await removeScheduledSmsJob(id)");
  });

  it("extends recurring scheduling to support daily and custom cron patterns", () => {
    expect(schedulingActions).toContain('type: z.enum(["daily", "weekly", "monthly", "custom"])');
    expect(schedulingActions).toContain('if (type === "daily")');
    expect(schedulingActions).toContain('if (type === "custom" && cron)');
  });
});
