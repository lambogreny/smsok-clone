import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");
const senderActionsSource = readFileSync(resolve(ROOT, "lib/actions/sender-names.ts"), "utf-8");
const senderNameRouteSource = readFileSync(resolve(ROOT, "app/api/v1/senders/name/route.ts"), "utf-8");
const contactsRouteSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/route.ts"), "utf-8");
const contactDetailRouteSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/[id]/route.ts"), "utf-8");
const packagePurchaseVerifyRouteSource = readFileSync(
  resolve(ROOT, "app/api/v1/payments/topup/verify-slip/route.ts"),
  "utf-8",
);
const paymentVerifyRouteSource = readFileSync(resolve(ROOT, "app/api/payments/[id]/verify/route.ts"), "utf-8");

describe("Task #2551: backend QA regressions", () => {
  it("builds CSP per-route so Swagger CDN assets and Sentry ingest remain allowed", () => {
    expect(middlewareSource).toContain("function buildContentSecurityPolicy");
    expect(middlewareSource).toContain("https://cdn.jsdelivr.net");
    expect(middlewareSource).toContain("https://*.ingest.sentry.io");
    expect(middlewareSource).toContain('connectSrc.push("ws:", "http://localhost:*", "https://localhost:*")');
  });

  it("keeps duplicate contact and sender requests on HTTP 409 conflicts", () => {
    expect(contactsRouteSource).toContain('new ApiError(409, error.message, "DUPLICATE")');
    expect(contactDetailRouteSource).toContain('new ApiError(409, error.message, "DUPLICATE")');
    expect(senderActionsSource).toContain('throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว")');
    expect(senderNameRouteSource).toContain('throw new ApiError(409, "ชื่อผู้ส่งนี้มีอยู่แล้ว", "DUPLICATE")');
  });

  it("avoids reusing duplicate slip references as payment idempotency keys", () => {
    expect(packagePurchaseVerifyRouteSource).toContain(
      "idempotencyKey: duplicateId ? null : (verification.data?.transRef ?? null)",
    );
    expect(packagePurchaseVerifyRouteSource).toContain("duplicateReferenceId: duplicateId");
    expect(paymentVerifyRouteSource).toContain("...(duplicateSlip ? {} : { idempotencyKey: slipData.transRef })");
  });
});
