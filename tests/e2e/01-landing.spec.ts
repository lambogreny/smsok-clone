import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    // Dismiss cookie
    const acceptBtn = page.getByText("ยอมรับทั้งหมด");
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }
    await page.evaluate(() => {
      document.querySelectorAll('[aria-label*="คุกกี้"], [class*="consent"], [class*="cookie"]').forEach(el => el.remove());
    }).catch(() => {});
  });

  test("LP-01: homepage loads with SMSOK branding", async ({ page }) => {
    await expect(page).toHaveTitle(/SMSOK/i);
    await expect(page.locator("body")).toContainText(/SMSOK|SMS/);
    await page.screenshot({ path: "test-results/01-landing-home.png" });
  });

  test("LP-02: login link visible and navigates", async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]').first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await page.waitForURL(/\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("LP-03: register link visible and navigates", async ({ page }) => {
    const regLink = page.locator('a[href*="register"]').first();
    await expect(regLink).toBeVisible();
    await regLink.click();
    await page.waitForURL(/\/register/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("LP-04: packages page loads (public)", async ({ page }) => {
    await page.goto("/dashboard/packages");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/Starter|Basic|Growth|Business|แพ็กเกจ|package/i);
    await page.screenshot({ path: "test-results/01-landing-packages.png" });
  });

  test("LP-05: responsive — mobile 375px no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
    });
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/01-landing-mobile.png" });
  });

  test("LP-06: responsive — tablet 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 10;
    });
    expect(hasOverflow).toBe(false);
  });

  test("LP-07: no console errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto("/");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  test("LP-08: forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ลืมรหัสผ่าน|forgot|reset/i);
  });
});
