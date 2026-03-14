import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("SMS History & Reports", () => {
  // === History Page ===
  test("HIST-01: history page loads without error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/09-history-page.png" });
  });

  test("HIST-02: history shows entries or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    const hasEntries = body?.match(/สำเร็จ|ล้มเหลว|DELIVERED|SENT|FAILED|pending/i);
    const hasEmpty = body?.match(/ยังไม่มี|ไม่พบ|No messages|No data/i);
    expect(hasEntries || hasEmpty).toBeTruthy();
  });

  test("HIST-03: history has filter controls", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    // Check for date filters, status filters, or search
    const dateInput = page.locator('input[type="date"]').first();
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="ค้นหา"], input[placeholder*="search"]').first();
    const filterBtn = page.getByText(/สถานะ|Status|กรอง|Filter/i).first();

    const hasDateFilter = await dateInput.isVisible({ timeout: 3000 }).catch(() => false);
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    const hasFilterBtn = await filterBtn.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasDateFilter || hasSearch || hasFilterBtn).toBeTruthy();
    await page.screenshot({ path: "test-results/09-history-filters.png" });
  });

  test("HIST-04: history no console errors", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/history", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  test("HIST-05: history responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/history", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/09-history-mobile.png" });
  });

  // === Reports / Analytics Page ===
  test("RPT-01: reports page loads without error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/reports", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/09-reports-page.png" });
  });

  test("RPT-02: reports show stats or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/reports", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    const hasStats = body?.match(/ส่งทั้งหมด|สำเร็จ|ล้มเหลว|Total|Delivered|Failed|จำนวน|report|SMS/i);
    const hasEmpty = body?.match(/ยังไม่มี|ไม่พบ|No data/i);
    // Page should have some content
    expect(hasStats || hasEmpty || (body && body.length > 200)).toBeTruthy();
  });

  test("RPT-03: reports no console errors", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/reports", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  test("RPT-04: reports responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/reports", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/09-reports-mobile.png" });
  });

  // === Activity / Logs ===
  test("ACT-01: activity page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/activity", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/09-activity-page.png" });
  });
});
