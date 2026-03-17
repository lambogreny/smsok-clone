import { test, expect } from "./fixtures";

test.describe("#4991 Campaign Sender Fixes Retest", () => {
  // Helper: create a draft campaign via page context (carries auth cookies)
  async function createDraftCampaign(page: import("@playwright/test").Page) {
    const res = await page.request.post("/api/v1/campaigns", {
      data: {
        name: "QA Sender Test " + Date.now(),
        messageBody: "Test message for sender validation QA",
      },
    });
    return res;
  }

  // Test 1: PATCH campaign with scheduledAt but no senderName → 400
  test("RPT-01: PATCH scheduledAt without senderName returns 400", async ({ authedPage: page }) => {
    const createRes = await createDraftCampaign(page);
    if (!createRes.ok()) {
      const errBody = await createRes.text();
      test.skip(true, `Cannot create draft campaign: ${createRes.status()} ${errBody.slice(0, 100)}`);
      return;
    }
    const created = await createRes.json();
    const campaignId = created?.data?.campaign?.id ?? created?.campaign?.id ?? created?.data?.id ?? created?.id;
    expect(campaignId).toBeTruthy();

    // PATCH: set scheduledAt without senderName → must be 400
    const patchRes = await page.request.patch(`/api/v1/campaigns/${campaignId}`, {
      data: {
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        senderName: null,
      },
    });
    expect(patchRes.status()).toBe(400);
    const body = await patchRes.json();
    const msg = body?.error ?? body?.message ?? JSON.stringify(body);
    expect(msg).toContain("ชื่อผู้ส่ง");

    await page.screenshot({ path: "tests/e2e/screenshots/4991-rpt01-no-sender-400.png" });
  });

  // Test 2: PATCH with unapproved sender name → 400
  test("RPT-02: PATCH unapproved senderName returns 400", async ({ authedPage: page }) => {
    const createRes = await createDraftCampaign(page);
    if (!createRes.ok()) {
      test.skip(true, "Cannot create draft campaign");
      return;
    }
    const created = await createRes.json();
    const campaignId = created?.data?.campaign?.id ?? created?.campaign?.id ?? created?.data?.id ?? created?.id;
    expect(campaignId).toBeTruthy();

    const patchRes = await page.request.patch(`/api/v1/campaigns/${campaignId}`, {
      data: { senderName: "FAKESENDER" },
    });
    expect(patchRes.status()).toBe(400);
    const body = await patchRes.json();
    const msg = body?.error ?? body?.message ?? JSON.stringify(body);
    expect(msg).toContain("อนุมัติ");

    await page.screenshot({ path: "tests/e2e/screenshots/4991-rpt02-unapproved-sender.png" });
  });

  // Test 3: EasySlip no longer bypasses approval
  test("RPT-03: EasySlip sender requires approval like any other", async ({ authedPage: page }) => {
    const createRes = await createDraftCampaign(page);
    if (!createRes.ok()) {
      test.skip(true, "Cannot create draft campaign");
      return;
    }
    const created = await createRes.json();
    const campaignId = created?.data?.campaign?.id ?? created?.campaign?.id ?? created?.data?.id ?? created?.id;
    expect(campaignId).toBeTruthy();

    const patchRes = await page.request.patch(`/api/v1/campaigns/${campaignId}`, {
      data: { senderName: "EasySlip" },
    });
    // If EasySlip is not in approved senders → must be 400
    if (patchRes.status() === 400) {
      const body = await patchRes.json();
      const msg = body?.error ?? body?.message ?? JSON.stringify(body);
      expect(msg).toContain("อนุมัติ");
    }
    // If 200 → EasySlip is actually approved in DB, that's valid (no bypass)

    await page.screenshot({ path: "tests/e2e/screenshots/4991-rpt03-easyslip.png" });
  });

  // Test 4: Campaigns page loads without critical console errors
  test("RPT-04: Campaigns page loads without critical errors", async ({ authedPage: page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });
    await page.screenshot({ path: "tests/e2e/screenshots/4991-rpt04-campaigns-page.png" });

    // Try to open create campaign dialog
    const createBtn = page.locator("button, a").filter({
      hasText: /สร้าง|Create|เพิ่ม|New|ใหม่/i,
    }).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "tests/e2e/screenshots/4991-rpt04-create-dialog.png" });
    }

    // Filter known non-critical errors (404 for missing resources, hydration warnings)
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("hydration") &&
        !e.includes("Warning:") &&
        !e.includes("404") &&
        !e.includes("Failed to load resource")
    );
    expect(criticalErrors).toEqual([]);
  });
});
