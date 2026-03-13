import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const canonicalOrdersRoute = readFileSync(resolve(ROOT, "app/api/orders/route.ts"), "utf-8");
const v1OrdersRoute = readFileSync(resolve(ROOT, "app/api/v1/orders/route.ts"), "utf-8");
const expireRoute = readFileSync(resolve(ROOT, "app/api/orders/[id]/expire/route.ts"), "utf-8");
const service = readFileSync(resolve(ROOT, "lib/orders/service.ts"), "utf-8");

describe("Task #2052: pending orders + customer type flow", () => {
  it("stores company/WHT fields in the Order schema", () => {
    expect(schema).toContain("customerType       OrderCustomerType");
    expect(schema).toContain("hasWht             Boolean");
    expect(schema).toContain("whtAmount          Decimal");
    expect(schema).toContain("@@map(\"orders\")");
  });

  it("supports canonical order creation plus company/WHT aliases in the v1 create route", () => {
    expect(canonicalOrdersRoute).toContain('export { POST } from "@/app/api/v1/orders/route";');
    expect(v1OrdersRoute).toContain("company_name");
    expect(v1OrdersRoute).toContain("company_address");
    expect(v1OrdersRoute).toContain("wht_applicable");
    expect(v1OrdersRoute).toContain("status: \"PENDING_PAYMENT\"");
  });

  it("uses a 7 day expiry window for bank transfer orders and serializes pending-company fields", () => {
    expect(service).toContain("7 * 24 * 60 * 60 * 1000");
    expect(service).toContain("company_name");
    expect(service).toContain("wht_applicable");
    expect(service).toContain("PENDING_PAYMENT: \"pending_payment\"");
  });

  it("provides an explicit expire route for overdue pending orders", () => {
    expect(expireRoute).toContain("export async function PATCH");
    expect(expireRoute).toContain("status: \"EXPIRED\"");
    expect(expireRoute).toContain("createOrderHistory");
    expect(expireRoute).toContain("Order expired after pending payment window elapsed");
  });
});
