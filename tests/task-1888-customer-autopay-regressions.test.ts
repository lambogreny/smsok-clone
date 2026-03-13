import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const v1UploadRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/upload/route.ts"),
  "utf-8",
);
const canonicalSlipRoute = readFileSync(
  resolve(ROOT, "app/api/orders/[id]/slip/route.ts"),
  "utf-8",
);

describe("Task #1888: customer order slip upload queues worker verification", () => {
  it("persists the upload and enqueues verification instead of calling SlipOK in the request", () => {
    expect(v1UploadRoute).toContain('export { POST } from "@/app/api/orders/[id]/slip/route";');
    expect(canonicalSlipRoute).toContain("slipVerifyQueue.add");
    expect(canonicalSlipRoute).toContain('status: "VERIFYING"');
    expect(canonicalSlipRoute).toContain("SLIP_QUEUED_STATUS_NOTE");
    expect(canonicalSlipRoute).not.toContain("verifySlip(slipBlob");
  });

  it("uses the canonical route and v1 alias with the same queued verification flow", () => {
    expect(canonicalSlipRoute).toContain("slipVerifyQueue.add");
    expect(canonicalSlipRoute).toContain('pending_review: false');
    expect(canonicalSlipRoute).toContain("queued: queueQueued");
  });

  it("rolls the upload back if the worker job cannot be queued", () => {
    expect(canonicalSlipRoute).toContain("Failed to rollback after queue enqueue error");
    expect(canonicalSlipRoute).toContain('throw new ApiError(503, "ระบบตรวจสอบสลิปยังไม่พร้อม กรุณาลองใหม่")');
    expect(canonicalSlipRoute).toContain("deletedAt: new Date()");
  });
});
