import { test, expect } from "@playwright/test";
import { TEST_USER, dismissCookieConsent } from "./fixtures";

test.describe("Login & Logout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);
  });

  test("LOGIN-01: login page has email and password fields", async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await page.screenshot({ path: "test-results/03-login-page.png" });
  });

  test("LOGIN-02: submit disabled with empty fields", async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test("LOGIN-03: submit enabled after filling both fields", async ({ page }) => {
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.waitForTimeout(300);
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
  });

  test("LOGIN-04: valid login redirects to dashboard", async ({ page }) => {
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);
    await page.screenshot({ path: "test-results/03-login-dashboard.png" });
  });

  test("LOGIN-05: invalid password shows error", async ({ page }) => {
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill("Wrong" + process.env.E2E_USER_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่ถูกต้อง|invalid|error|ผิดพลาด/i);
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: "test-results/03-login-invalid.png" });
  });

  test("LOGIN-06: non-existent email shows error", async ({ page }) => {
    await page.locator('input[type="email"]').fill("nonexist@smsok.test");
    await page.locator('input[type="password"]').fill("SomePass123!");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่ถูกต้อง|invalid|error/i);
  });

  test("LOGIN-07: protected routes redirect to login", async ({ page }) => {
    // Clear auth state
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("LOGIN-08: logout clears session", async ({ page }) => {
    // Login first
    await page.locator('input[type="email"]').fill(TEST_USER.email);
    await page.locator('input[type="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Find and click logout
    const logoutBtn = page.locator('button:has-text("ออกจากระบบ"), a:has-text("ออกจากระบบ"), button:has-text("Logout")').first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/\/login|\/$/);
    } else {
      // Try via API
      await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
      await page.goto("/dashboard");
      await page.waitForURL(/\/login/, { timeout: 10000 });
    }
    await page.screenshot({ path: "test-results/03-login-logout.png" });
  });

  test("LOGIN-09: forgot password link works", async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"]').first();
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await page.waitForURL(/\/forgot/);
  });

  test("LOGIN-10: no console errors on login page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto("/login");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });
});
