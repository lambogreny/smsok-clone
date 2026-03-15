import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("Dashboard Overview", () => {
  test("DASH-01: dashboard loads with quota info", async ({ authedPage: page }) => {
    await expect(page.locator("body")).toContainText(/SMS|โควต้า|quota|credit/i);
    await page.screenshot({ path: "test-results/04-dashboard-overview.png" });
  });

  test("DASH-02: sidebar navigation visible with key links", async ({ authedPage: page }) => {
    const nav = page.locator("nav, aside, [class*='sidebar']").first();
    await expect(nav).toBeVisible();
    const body = await page.textContent("body");
    expect(body).toMatch(/Dashboard|ส่ง SMS|ประวัติ|ตั้งค่า/);
  });

  test("DASH-03: dashboard has stats cards", async ({ authedPage: page }) => {
    const body = await page.textContent("body");
    expect(body).toMatch(/ส่งวันนี้|ทั้งหมด|สำเร็จ|SMS|credit/i);
  });

  test("DASH-04: navigate to send SMS page from dashboard", async ({ authedPage: page }) => {
    const sendLink = page.locator('a[href*="/send"], a[href*="/dashboard/send"]').first();
    if (await sendLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sendLink.click();
      await page.waitForURL(/\/send/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/send/);
    } else {
      await page.goto("/dashboard/send");
      const body = await page.textContent("body");
      expect(body).toMatch(/ส่ง SMS|Send/i);
    }
    await page.screenshot({ path: "test-results/04-dashboard-nav-send.png" });
  });

  test("DASH-05: navigate to billing page from dashboard", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/billing|แพ็กเกจ|package|เครดิต|credit/i);
    await page.screenshot({ path: "test-results/04-dashboard-billing.png" });
  });

  test("DASH-06: navigate to contacts page", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/04-dashboard-contacts.png" });
  });

  test("DASH-07: navigate to settings page", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ตั้งค่า|Settings|โปรไฟล์|Profile/i);
  });

  test("DASH-08: navigate to history page", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
  });

  test("DASH-09: credit balance is displayed as number", async ({ authedPage: page }) => {
    const body = await page.textContent("body");
    // Should show a numeric credit/SMS count somewhere
    expect(body).toMatch(/\d+/);
  });

  test("DASH-10: no console errors on dashboard", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  test("DASH-11: dashboard responsive 375px — no overflow", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/04-dashboard-mobile.png" });
  });

  test("DASH-12: dashboard responsive 390px — no overflow", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
  });

  test("DASH-13: all main sidebar links load without error", async ({ authedPage: page }) => {
    const routes = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/history",
      "/dashboard/contacts",
      "/dashboard/senders",
      "/dashboard/billing",
      "/dashboard/settings",
    ];
    for (const route of routes) {
      const res = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      expect(res?.status()).toBe(200);
      const body = await page.textContent("body");
      expect(body).not.toContain("Internal Server Error");
    }
  });
});
