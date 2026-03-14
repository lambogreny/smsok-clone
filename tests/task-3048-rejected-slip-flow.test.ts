import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const rejectedSlipSource = readFileSync(resolve(ROOT, "lib/orders/rejected-slip.ts"), "utf-8");
const slipVerificationSource = readFileSync(resolve(ROOT, "lib/orders/slip-verification.ts"), "utf-8");
const slipRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");
const resubmitRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/resubmit-slip/route.ts"), "utf-8");
const resubmitAliasSource = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/resubmit-slip/route.ts"),
  "utf-8",
);
const cronRouteSource = readFileSync(resolve(ROOT, "app/api/cron/orders/expire/route.ts"), "utf-8");
const orderServiceSource = readFileSync(resolve(ROOT, "lib/orders/service.ts"), "utf-8");

describe("Task #3048: rejected slip flow backend", () => {
  it("extends the order schema with structured rejected-slip fields", () => {
    expect(schemaSource).toContain('rejectReason       String?           @db.VarChar(30) @map("reject_reason")');
    expect(schemaSource).toContain('rejectMessage      String?           @map("reject_message")');
    expect(schemaSource).toContain('rejectedAt         DateTime?         @map("rejected_at")');
    expect(schemaSource).toContain('slipAttemptCount   Int               @default(0) @map("slip_attempt_count")');
    expect(schemaSource).toContain('transRef   String?   @unique @map("trans_ref")');
  });

  it("keeps explicit reject codes and a max-attempt constant", () => {
    expect(rejectedSlipSource).toContain("MAX_SLIP_ATTEMPTS = 5");
    expect(rejectedSlipSource).toContain('"DUPLICATE_SLIP"');
    expect(rejectedSlipSource).toContain('"INVALID_SLIP"');
    expect(rejectedSlipSource).toContain('"AMOUNT_MISMATCH"');
    expect(rejectedSlipSource).toContain('"EXPIRED_SLIP"');
    expect(rejectedSlipSource).toContain('"WRONG_ACCOUNT"');
    expect(rejectedSlipSource).toContain('"UNREADABLE_SLIP"');
  });

  it("writes reject code/message/timestamp and increments attempts inside the worker reject path", () => {
    expect(slipVerificationSource).toContain("rejectReason: rejection.code");
    expect(slipVerificationSource).toContain("rejectMessage: rejection.message");
    expect(slipVerificationSource).toContain("rejectedAt: new Date()");
    expect(slipVerificationSource).toContain("slipAttemptCount: {");
    expect(slipVerificationSource).toContain("increment: 1");
  });

  it("validates duplicate, timestamp, receiver account, amount, and unreadable-slip cases", () => {
    expect(slipVerificationSource).toContain("buildRejectResolution(\"DUPLICATE_SLIP\")");
    expect(slipVerificationSource).toContain("buildRejectResolution(\"EXPIRED_SLIP\")");
    expect(slipVerificationSource).toContain("buildRejectResolution(\"WRONG_ACCOUNT\")");
    expect(slipVerificationSource).toContain("buildRejectResolution(\"AMOUNT_MISMATCH\")");
    expect(slipVerificationSource).toContain("buildRejectResolution(\"UNREADABLE_SLIP\")");
    expect(slipVerificationSource).toContain("Date.now() - slipDate.getTime() > SLIP_MAX_AGE_MS");
    expect(slipVerificationSource).toContain("checkReceiverAccount(verification.data.receiver.account)");
  });

  it("blocks fresh uploads after the max attempt limit and clears reject fields when re-queueing", () => {
    expect(slipRouteSource).toContain("order.slipAttemptCount >= MAX_SLIP_ATTEMPTS");
    expect(slipRouteSource).toContain("rejectReason: null");
    expect(slipRouteSource).toContain("rejectMessage: null");
    expect(slipRouteSource).toContain("rejectedAt: null");
  });

  it("adds a dedicated resubmit-slip endpoint with max-attempt enforcement and a v1 alias", () => {
    expect(resubmitRouteSource).toContain("order.slipAttemptCount >= MAX_SLIP_ATTEMPTS");
    expect(resubmitRouteSource).toContain("rejectReason: { not: null }");
    expect(resubmitRouteSource).toContain("Customer requested to resubmit slip");
    expect(resubmitRouteSource).toContain("rejectReason: null");
    expect(resubmitRouteSource).toContain("rejectMessage: null");
    expect(resubmitRouteSource).toContain("rejectedAt: null");
    expect(resubmitAliasSource).toContain('export { POST } from "@/app/api/orders/[id]/resubmit-slip/route";');
  });

  it("serializes both legacy reject text and structured reject metadata", () => {
    expect(orderServiceSource).toContain("reject_code: rejectCode");
    expect(orderServiceSource).toContain("reject_message: rejectMessage");
    expect(orderServiceSource).toContain("rejected_at: order.rejectedAt?.toISOString()");
    expect(orderServiceSource).toContain("slip_attempt_count: order.slipAttemptCount");
  });

  it("auto-cancels stale pending/rejected orders after 7 days via cron", () => {
    expect(cronRouteSource).toContain("ORDER_AUTO_CANCEL_AGE_DAYS = 7");
    expect(cronRouteSource).toContain('status: "PENDING_PAYMENT"');
    expect(cronRouteSource).toContain('status: "CANCELLED"');
    expect(cronRouteSource).toContain("Rejected order auto-cancelled after 7 days");
  });
});
