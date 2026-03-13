import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const slipRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");
const slipVerificationSource = readFileSync(
  resolve(ROOT, "lib/orders/slip-verification.ts"),
  "utf-8",
);

describe("Task #2881: slip worker race-condition hardening", () => {
  it("rejects re-upload attempts while the current order is already verifying", () => {
    expect(slipRouteSource).toContain('if (order.status === "VERIFYING")');
    expect(slipRouteSource).toContain('throw new ApiError(409, "กำลังตรวจสอบสลิปอยู่ กรุณารอ")');
    expect(slipRouteSource).not.toContain('["PENDING_PAYMENT", "VERIFYING"].includes(order.status)');
  });

  it("awaits queue history persistence instead of firing it and forgetting the promise", () => {
    expect(slipRouteSource).toContain("try {");
    expect(slipRouteSource).toContain("await db.$transaction(async (tx) => {");
    expect(slipRouteSource).toContain("note: SLIP_QUEUED_REVIEW_NOTE");
  });

  it("guards worker mutations with the latest slip id and current VERIFYING status", () => {
    expect(slipVerificationSource).toContain("async function getCurrentQueuedSlipTarget");
    expect(slipVerificationSource).toContain('if (currentOrder.status !== "VERIFYING")');
    expect(slipVerificationSource).toContain("if (currentOrder.slips[0]?.id !== orderSlipId)");
    expect(slipVerificationSource).toContain('note: "Slip job is stale"');
    expect(slipVerificationSource).toContain('where: { id: order.id, status: "VERIFYING" }');
  });
});
