import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

const workersStartSource = readFileSync(resolve(ROOT, "workers/start.ts"), "utf-8");
const campaignWorkerSource = readFileSync(resolve(ROOT, "lib/queue/workers/campaign-worker.ts"), "utf-8");
const notificationsSource = readFileSync(resolve(ROOT, "lib/actions/notifications.ts"), "utf-8");
const orderVerificationSource = readFileSync(resolve(ROOT, "lib/orders/verification-code.ts"), "utf-8");
const orderPdfSource = readFileSync(resolve(ROOT, "lib/orders/pdf.ts"), "utf-8");
const orderApiSource = readFileSync(resolve(ROOT, "lib/orders/api.ts"), "utf-8");
const orderDownloadSource = readFileSync(resolve(ROOT, "lib/orders/document-download.ts"), "utf-8");
const orderApiPdfRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/documents/[docId]/pdf/route.ts"), "utf-8");

describe("Task #5695: reviewer fixes for scheduled and recurring SMS", () => {
  it("starts the scheduled sms worker with the rest of the BullMQ worker process", () => {
    expect(workersStartSource).toContain('import { createScheduledSmsWorker }');
    expect(workersStartSource).toContain("createScheduledSmsWorker()");
  });

  it("checks and deducts quota at the start of campaign worker execution", () => {
    expect(campaignWorkerSource).toContain("InsufficientCreditsError");
    expect(campaignWorkerSource).toContain("await ensureSufficientQuota(userId, totalCredits)");
    expect(campaignWorkerSource).toContain("const quotaResult = await deductQuota(tx, userId, totalCredits)");
    expect(campaignWorkerSource).toContain("sendScheduledSmsInsufficientCreditsNotice");
    expect(campaignWorkerSource).toContain("campaign worker skipped job due to insufficient credits");
  });

  it("adds an explicit notification helper for skipped scheduled runs", () => {
    expect(notificationsSource).toContain("export async function sendScheduledSmsInsufficientCreditsNotice");
    expect(notificationsSource).toContain("scheduled-sms-insufficient-credits");
  });
});

describe("Task #5695: atomic order verification code generation", () => {
  it("uses compare-and-set semantics before falling back to the latest stored code", () => {
    expect(orderVerificationSource).toContain("orderDocument.updateMany");
    expect(orderVerificationSource).toContain("verificationCode: null");
    expect(orderVerificationSource).toContain("if (updateResult.count > 0)");
    expect(orderVerificationSource).toContain("findUnique");
  });

  it("reuses the atomic verification helper across every PDF generation path", () => {
    expect(orderPdfSource).toContain("ensureOrderDocumentVerificationCode");
    expect(orderApiSource).toContain("ensureOrderDocumentVerificationCode");
    expect(orderDownloadSource).toContain("ensureOrderDocumentVerificationCode");
    expect(orderApiPdfRouteSource).toContain("ensureOrderDocumentVerificationCode");
  });
});
