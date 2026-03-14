import { test, expect } from "./fixtures";

test.describe("Dashboard Overview", () => {
  test("DASH-01: dashboard loads with quota info", async ({ authedPage: page }) => {
    await expect(page.locator("body")).toContainText(/SMS|โควต้า|quota/i);
    await page.screenshot({ path: "test-results/04-dashboard-overview.png" });
  });

  test("DASH-02: sidebar navigation visible", async ({ authedPage: page }) => {
    const nav = page.locator("nav, aside, [class*='sidebar']").first();
    await expect(nav).toBeVisible();
    const body = await page.textContent("body");
    expect(body).toMatch(/Dashboard|ส่ง SMS|ประวัติ|ตั้งค่า/);
  });

  test("DASH-03: dashboard has stats cards", async ({ authedPage: page }) => {
    const body = await page.textContent("body");
    expect(body).toMatch(/ส่งวันนี้|ทั้งหมด|สำเร็จ|SMS|credit/i);
  });

  test("DASH-04: no console errors on dashboard", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  test("DASH-05: dashboard responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/04-dashboard-mobile.png" });
  });
});
