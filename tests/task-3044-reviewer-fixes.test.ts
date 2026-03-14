import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const devScriptSource = readFileSync(resolve(ROOT, "scripts/dev.ts"), "utf-8");
const workersStartSource = readFileSync(resolve(ROOT, "workers/start.ts"), "utf-8");
const checkoutPageSource = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/billing/checkout/page.tsx"),
  "utf-8",
);
const settingsBillingPageSource = readFileSync(
  resolve(ROOT, "app/(dashboard)/dashboard/settings/billing/page.tsx"),
  "utf-8",
);
const orderCreateRouteSource = readFileSync(resolve(ROOT, "app/api/v1/orders/route.ts"), "utf-8");

describe("Task #3044: reviewer fixes", () => {
  it("validates env eagerly when starting the dev stack and worker process", () => {
    expect(devScriptSource).toContain('import { getEnv } from "../lib/env"');
    expect(devScriptSource).toContain("getEnv()");
    expect(workersStartSource).toContain('import { getEnv } from "../lib/env"');
    expect(workersStartSource).toContain("getEnv()");
  });

  it("loads saved tax data from taxProfile responses in checkout and billing settings", () => {
    expect(checkoutPageSource).toContain("json?.data?.taxProfile ?? json?.taxProfile");
    expect(settingsBillingPageSource).toContain("json?.data?.taxProfile ?? json?.taxProfile ?? json");
  });

  it("keeps save_tax_profile available for INDIVIDUAL orders too", () => {
    expect(orderCreateRouteSource).toContain('save_tax_profile: z.boolean().default(false)');
    expect(orderCreateRouteSource).toContain("if (input.save_tax_profile)");
    expect(orderCreateRouteSource).toContain("? input.company_name?.trim() || input.tax_name : input.tax_name");
    expect(orderCreateRouteSource).toContain("taxProfileId = profile.id");
  });
});
