import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const storageServiceSource = readFileSync(resolve(ROOT, "lib/storage/service.ts"), "utf-8");
const easyslipSource = readFileSync(resolve(ROOT, "lib/easyslip.ts"), "utf-8");
const orderServiceSource = readFileSync(resolve(ROOT, "lib/orders/service.ts"), "utf-8");
const slipRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");
const slipVerificationSource = readFileSync(resolve(ROOT, "lib/orders/slip-verification.ts"), "utf-8");
const orderDetailPageSource = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/billing/orders/[id]/page.tsx"),
  "utf-8",
);

describe("Task #2811: slip timestamp + pending review fixes", () => {
  it("reads stored files from both r2 refs and raw storage keys", () => {
    expect(storageServiceSource).toContain("extractStoredFileKey(value) ?? value");
    expect(storageServiceSource).toContain("return downloadFileFromR2(key);");
  });

  it("surfaces provider-side EasySlip expiry for manual review handling", () => {
    expect(easyslipSource).toContain('providerCode === "application_expired"');
    expect(slipVerificationSource).toContain("getPendingReviewMessage");
    expect(slipVerificationSource).toContain("adminNote: pendingReviewMessage");
    expect(slipRouteSource).toContain("latest_status_note: SLIP_QUEUED_STATUS_NOTE");
  });

  it("uses the latest uploaded slip timestamp on order detail instead of order created_at", () => {
    expect(orderServiceSource).toContain("latest_slip_uploaded_at");
    expect(orderServiceSource).toContain("return attachLatestStatusNote(");
    expect(orderServiceSource).toContain("attachLatestSlip(base, order.slips)");
    expect(orderDetailPageSource).toContain("order.latest_slip_uploaded_at");
    expect(slipRouteSource).toContain("latest_slip_uploaded_at: result.createdSlip.uploadedAt.toISOString()");
    expect(orderDetailPageSource).not.toContain(
      'order.created_at ? formatThaiShortDate(order.created_at) : "—"',
    );
  });

  it("does not promise that WHT can be uploaded later when the route requires it with the slip", () => {
    expect(orderDetailPageSource).toContain("ต้องแนบใบ 50 ทวิพร้อมสลิปในครั้งนี้");
    expect(orderDetailPageSource).not.toContain("สามารถอัปโหลดทีหลังได้");
  });

  it("moves the order detail page onto the canonical order APIs instead of the legacy v1 aliases", () => {
    expect(orderDetailPageSource).toContain("/api/orders/${orderId}");
    expect(orderDetailPageSource).toContain("/api/orders/${currentOrder.id}/status");
    expect(orderDetailPageSource).toContain("/api/orders/${currentOrder.id}/slip");
    expect(orderDetailPageSource).not.toContain("/api/v1/orders/${orderId}");
    expect(orderDetailPageSource).not.toContain("/api/v1/orders/${currentOrder.id}/cancel");
    expect(orderDetailPageSource).not.toContain("/api/v1/orders/${currentOrder.id}/verify-slip");
    expect(orderDetailPageSource).toContain("normalizeOrderPayload");
  });
});
