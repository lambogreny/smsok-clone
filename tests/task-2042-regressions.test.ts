import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import { GET as getAutoTopup, POST as postAutoTopup } from "@/app/api/v1/packages/auto-topup/route";

const ROOT = resolve(__dirname, "..");
const legacyTopupRoute = readFileSync(resolve(ROOT, "app/api/v1/topup/route.ts"), "utf-8");
const packagePurchaseVerifyRoute = readFileSync(
  resolve(ROOT, "app/api/v1/packages/purchase/verify-slip/route.ts"),
  "utf-8",
);
const creditsBalanceRoute = readFileSync(resolve(ROOT, "app/api/credits/balance/route.ts"), "utf-8");
const creditsSummaryRoute = readFileSync(resolve(ROOT, "app/api/credits/route.ts"), "utf-8");
const creditBalanceRoute = readFileSync(resolve(ROOT, "app/api/credit-balance/route.ts"), "utf-8");
const notificationsRoute = readFileSync(resolve(ROOT, "app/api/notifications/route.ts"), "utf-8");
const openApiSpec = readFileSync(resolve(ROOT, "lib/openapi-spec.ts"), "utf-8");
const smsActions = readFileSync(resolve(ROOT, "lib/actions/sms.ts"), "utf-8");

describe("Task #2042: package-purchase terminology + deprecated wallet flows", () => {
  it("keeps the legacy /api/v1/topup endpoint deprecated in favor of package purchase", () => {
    expect(legacyTopupRoute).toContain("410");
    expect(legacyTopupRoute).toContain("/api/v1/packages/purchase");
  });

  it("adds a canonical package-purchase slip verification route", () => {
    expect(packagePurchaseVerifyRoute).toContain("payments/topup/verify-slip/route");
  });

  it("deprecates auto-topup routes in the new package-purchase flow", async () => {
    const getResponse = await getAutoTopup();
    const postResponse = await postAutoTopup();

    expect(getResponse.status).toBe(410);
    expect(postResponse.status).toBe(410);
    await expect(getResponse.json()).resolves.toMatchObject({
      error: "การซื้อแพ็กเกจอัตโนมัติถูกยกเลิกแล้ว ใช้การซื้อแพ็กเกจและแนบสลิปตามขั้นตอนใหม่แทน",
    });
  });

  it("adds remaining_credits terminology to the credits balance responses", () => {
    expect(creditsBalanceRoute).toContain("remaining_credits");
    expect(creditsBalanceRoute).toContain("total_quota");
    expect(creditsBalanceRoute).toContain("used_quota");
    expect(creditsSummaryRoute).toContain("remaining_credits");
    expect(creditsSummaryRoute).toContain("quotaSummary");
    expect(creditBalanceRoute).toContain("remaining_credits");
    expect(creditBalanceRoute).toContain("quotaSummary");
  });

  it("stops triggering auto-topup during SMS sends", () => {
    expect(smsActions).not.toContain("checkAndAutoTopup");
  });

  it("renames public package-purchase surfaces away from topup in notifications and openapi", () => {
    expect(notificationsRoute).toContain('type: "package_purchase"');
    expect(notificationsRoute).toContain("prisma.payment.findMany");
    expect(openApiSpec).toContain('"/packages/purchase"');
    expect(openApiSpec).toContain('"/packages/purchase/verify-slip"');
    expect(openApiSpec).toContain('"/packages/auto-topup"');
  });
});
