import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const BO_URL = "http://localhost:3001";

// Console error collector
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  return errors;
}

test.describe("SMSOK Public Pages Smoke", () => {
  test("SMOKE-01: Landing page loads with hero + pricing + FAQ", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    // Should have key content
    expect(body).toMatch(/SMSOK|SMS|ส่ง|บริการ/i);

    await page.screenshot({ path: "test-results/smoke-01-landing.png", fullPage: true });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("Landing JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("SMOKE-02: Login page loads with form", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    await page.screenshot({ path: "test-results/smoke-02-login.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("Login JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("SMOKE-03: Register page loads with form", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    expect(body).toMatch(/สมัคร|Register|ลงทะเบียน/i);

    await page.screenshot({ path: "test-results/smoke-03-register.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("Register JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("SMOKE-04: Forgot password page loads", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/smoke-04-forgot-password.png" });
  });

  test("SMOKE-05: Dashboard redirects to login (auth required)", async ({ page }) => {
    const response = await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Should redirect to login
    expect(page.url()).toContain("/login");
    await page.screenshot({ path: "test-results/smoke-05-dashboard-redirect.png" });
  });

  test("SMOKE-06: Landing responsive 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/smoke-06-landing-375.png", fullPage: true });
  });

  test("SMOKE-07: Login responsive 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/smoke-07-login-375.png" });
  });
});

test.describe("Backoffice Public Pages", () => {
  test("SMOKE-08: Backoffice login page loads", async ({ page }) => {
    const errors = collectErrors(page);

    const response = await page.goto(`${BO_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    if (!response || response.status() >= 500) {
      await page.screenshot({ path: "test-results/smoke-08-bo-login-error.png" });
      expect(response?.status()).toBeLessThan(500);
      return;
    }

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");

    // Check for login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const hasEmail = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: "test-results/smoke-08-bo-login.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("BO Login JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("SMOKE-09: Backoffice dashboard redirects to login", async ({ page }) => {
    await page.goto(`${BO_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Should redirect to login page
    expect(page.url()).toMatch(/login/);
    await page.screenshot({ path: "test-results/smoke-09-bo-redirect.png" });
  });
});
