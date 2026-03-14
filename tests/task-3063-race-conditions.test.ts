import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const resubmitRouteSource = readFileSync(
  resolve(ROOT, "app/api/orders/[id]/resubmit-slip/route.ts"),
  "utf-8",
);
const expireCronRouteSource = readFileSync(
  resolve(ROOT, "app/api/cron/orders/expire/route.ts"),
  "utf-8",
);

describe("Task #3063: reviewer race-condition fixes", () => {
  it("guards resubmit-slip with optimistic locking on PENDING_PAYMENT", () => {
    expect(resubmitRouteSource).toContain("const result = await tx.order.updateMany({");
    expect(resubmitRouteSource).toContain('status: "PENDING_PAYMENT"');
    expect(resubmitRouteSource).toContain("rejectReason: { not: null }");
    expect(resubmitRouteSource).toContain('throw new ApiError(409, "order status changed")');
    expect(resubmitRouteSource).toContain("if (result.count !== 1)");
  });

  it("guards the order auto-cancel cron with optimistic locking per stale order", () => {
    expect(expireCronRouteSource).toContain("const cancelledIds = await db.$transaction(async (tx) => {");
    expect(expireCronRouteSource).toContain("for (const order of staleOrders)");
    expect(expireCronRouteSource).toContain("const updated = await tx.order.updateMany({");
    expect(expireCronRouteSource).toContain('status: "PENDING_PAYMENT"');
    expect(expireCronRouteSource).not.toContain("db.orderHistory.createMany");
    expect(expireCronRouteSource).toContain("processed.push(order.id)");
  });
});
