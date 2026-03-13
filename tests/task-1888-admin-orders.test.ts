import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const adminOrdersRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/route.ts"), "utf-8");
const adminOrderStatsRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/stats/route.ts"), "utf-8");
const adminOrderApproveRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/[id]/approve/route.ts"), "utf-8");
const adminOrderRejectRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/[id]/reject/route.ts"), "utf-8");
const adminOrdersPage = readFileSync(resolve(ROOT, "app/admin/orders/page.tsx"), "utf-8");
const v1OrdersRoute = readFileSync(resolve(ROOT, "app/api/v1/orders/route.ts"), "utf-8");
const customerOrdersPage = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/billing/orders/page.tsx"),
  "utf-8",
);
const orderDocumentTypeRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/documents/[type]/route.ts"),
  "utf-8",
);
const orderDetailPage = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/billing/orders/[id]/page.tsx"),
  "utf-8",
);

describe("Task #1888: admin order review endpoints", () => {
  it("adds admin list and stats endpoints used by the admin orders page", () => {
    expect(adminOrdersRoute).toContain("export async function GET");
    expect(adminOrdersRoute).toContain("authenticateAdmin(req)");
    expect(adminOrdersRoute).toContain("orders: orders.map(serializeOrder)");
    expect(adminOrdersRoute).toContain("pending_review");
    expect(adminOrderStatsRoute).toContain("export async function GET");
    expect(adminOrderStatsRoute).toContain("pending_review");
  });

  it("adds approve and reject handlers for admin review actions", () => {
    expect(adminOrderApproveRoute).toContain('status: "PAID"');
    expect(adminOrderApproveRoute).toContain("activateOrderPurchase");
    expect(adminOrderApproveRoute).toContain("ensureOrderDocument(tx, order, \"TAX_INVOICE\")");
    expect(adminOrderRejectRoute).toContain('status: "CANCELLED"');
    expect(adminOrderRejectRoute).toContain("rejectReason: reason");
    expect(adminOrderRejectRoute).toContain("Order rejected:");
  });

  it("matches the frontend admin orders page contract", () => {
    expect(adminOrdersPage).toContain('fetch(`/api/admin/orders?${params.toString()}`');
    expect(adminOrdersPage).toContain('fetch("/api/admin/orders/stats"');
    expect(adminOrdersPage).toContain('fetch(`/api/admin/orders/${orderId}/approve`');
    expect(adminOrdersPage).toContain('fetch(`/api/admin/orders/${orderId}/reject`');
  });

  it("adds type-based order document downloads used by the order detail page", () => {
    expect(orderDocumentTypeRoute).toContain('GET /api/v1/orders/:id/documents/:type');
    expect(orderDocumentTypeRoute).toContain("buildOrderDocumentDownloadResponse");
    expect(orderDetailPage).toContain("/api/v1/orders/${order.id}/documents/tax-invoice");
    expect(orderDetailPage).toContain("/api/v1/orders/${order.id}/documents/receipt");
  });

  it("keeps the customer orders list filters aligned with the v1 orders API", () => {
    expect(customerOrdersPage).toContain('params.set("from", dateFrom)');
    expect(customerOrdersPage).toContain('params.set("to", dateTo)');
    expect(v1OrdersRoute).toContain('from: z.string().date().optional()');
    expect(v1OrdersRoute).toContain('to: z.string().date().optional()');
    expect(v1OrdersRoute).toContain("expiresAt: { lt: new Date() }");
    expect(v1OrdersRoute).toContain("where.createdAt = {");
  });
});
