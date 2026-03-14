import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const slipRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");
const slipVerificationSource = readFileSync(resolve(ROOT, "lib/orders/slip-verification.ts"), "utf-8");
const orderStatusRouteSource = readFileSync(resolve(ROOT, "app/api/orders/[id]/status/route.ts"), "utf-8");
const adminApproveRouteSource = readFileSync(
  resolve(ROOT, "app/api/admin/orders/[id]/approve/route.ts"),
  "utf-8",
);
const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");

describe("Task #3018: order slip anti-fraud guardrails", () => {
  it("keeps uploaded slip orders in VERIFYING instead of granting quota in the request path", () => {
    expect(slipRouteSource).toContain('status: "VERIFYING"');
    expect(slipRouteSource).toContain("slipVerifyQueue.add");
    expect(slipRouteSource).not.toContain("activateOrderPurchase");
    expect(slipRouteSource).not.toContain('status: "PAID"');
  });

  it("grants quota only after the worker atomically moves a VERIFYING order to PAID", () => {
    expect(slipVerificationSource).toContain('where: { id: order.id, status: "VERIFYING" }');
    expect(slipVerificationSource).toContain('status: "PAID"');
    expect(slipVerificationSource).toContain("await activateOrderPurchase(tx, {");
    expect(slipVerificationSource).toContain('status: "PENDING_PAYMENT"');
    expect(slipVerificationSource).toContain('"สลิปนี้ถูกใช้แล้ว"');
  });

  it("keeps duplicate protection in both EasySlip and the database layer", () => {
    expect(slipVerificationSource).toContain("if (verification.isDuplicate)");
    expect(slipVerificationSource).toContain("db.orderSlip.findFirst");
    expect(schemaSource).toContain('transRef   String?   @unique @map("trans_ref")');
  });

  it("prevents the generic order-status route from bypassing slip verification into PAID", () => {
    expect(orderStatusRouteSource).toContain('// "paid" removed');
    expect(orderStatusRouteSource).toContain('if (isAdmin && !ADMIN_ALLOWED_TARGETS.has(input.status))');
    expect(adminApproveRouteSource).toContain('if (!["VERIFYING", "PENDING_PAYMENT"].includes(order.status))');
  });
});
