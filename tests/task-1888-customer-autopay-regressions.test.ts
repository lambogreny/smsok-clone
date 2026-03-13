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

describe("Task #1888: customer order slip upload auto-pays immediately", () => {
  it("rejects failed or mismatched EasySlip checks before saving a review state", () => {
    expect(v1UploadRoute).toContain("if (!verification.success)");
    expect(v1UploadRoute).toContain('throw new ApiError(400, verification.error ?? "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่");');
    expect(v1UploadRoute).toContain('throw new ApiError(400, "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ");');
    expect(v1UploadRoute).not.toContain('status: nextStatus');
    expect(v1UploadRoute).not.toContain("awaiting verification");
  });

  it("marks paid immediately and activates the purchased package in the v1 route", () => {
    expect(v1UploadRoute).toContain('status: "PAID"');
    expect(v1UploadRoute).toContain("await activateOrderPurchase(tx, {");
    expect(v1UploadRoute).toContain('await ensureOrderDocument(tx, order, "RECEIPT");');
    expect(v1UploadRoute).toContain('await ensureOrderDocument(tx, order, "TAX_INVOICE");');
    expect(v1UploadRoute).toContain('note: "EasySlip verified — order paid automatically"');
  });

  it("keeps the canonical customer slip route aligned with the same auto-pay flow", () => {
    expect(canonicalSlipRoute).toContain('status: "PAID"');
    expect(canonicalSlipRoute).toContain("await activateOrderPurchase(tx, {");
    expect(canonicalSlipRoute).toContain('await ensureOrderDocument(tx, order, "RECEIPT");');
    expect(canonicalSlipRoute).toContain('throw new ApiError(400, "จำนวนเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ");');
    expect(canonicalSlipRoute).not.toContain('status: "VERIFYING"');
  });
});
