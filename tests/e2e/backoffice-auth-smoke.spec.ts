import { test, expect, type Page } from "@playwright/test";

const BO_URL = "http://localhost:3001";
const ADMIN = { email: "admin@smsok.com", password: "QAAdmin2026!!" };

// Console error collector
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  return errors;
}

// Login helper
async function boLogin(page: Page) {
  await page.goto(`${BO_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(ADMIN.email);
  await passwordInput.fill(ADMIN.password);

  await page.screenshot({ path: "test-results/bo-auth-00-login-filled.png" });

  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.waitFor({ state: "visible", timeout: 5000 });

  // Wait for button to be enabled
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    },
    { timeout: 10000 }
  ).catch(async () => {
    await emailInput.clear();
    await emailInput.type(ADMIN.email);
    await passwordInput.clear();
    await passwordInput.type(ADMIN.password);
  });

  await submitBtn.click();

  // Wait for navigation away from login
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 }).catch(async () => {
    // If still on login, take screenshot for debugging
    await page.screenshot({ path: "test-results/bo-auth-00-login-stuck.png" });
  });

  await page.screenshot({ path: "test-results/bo-auth-00-login-success.png" });
}

test.describe("Backoffice Authenticated Smoke", () => {

  test("BO-AUTH-01: Admin login succeeds", async ({ page }) => {
    const errors = collectErrors(page);
    await boLogin(page);

    // Should be on dashboard or password change page
    const url = page.url();
    expect(url).not.toContain("/login");

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");

    await page.screenshot({ path: "test-results/bo-auth-01-after-login.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("Login post JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("BO-AUTH-02: CEO Dashboard loads (bug retest #4211)", async ({ page }) => {
    const errors = collectErrors(page);
    await boLogin(page);

    await page.goto(`${BO_URL}/dashboard/ceo`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000); // Wait for KPI data to load

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");

    // Bug retest: Should NOT show "ไม่สามารถโหลดข้อมูล"
    const hasLoadError = body?.includes("ไม่สามารถโหลดข้อมูล") || false;
    if (hasLoadError) {
      console.log("🐛 CEO Dashboard still shows 'ไม่สามารถโหลดข้อมูล' error!");
    }

    // Bug retest: KPIs should show real numbers, not all ฿0
    const hasAllZero = body?.includes("฿0") && !body?.includes("฿1") && !body?.includes("฿5");
    if (hasAllZero) {
      console.log("⚠️ CEO Dashboard KPIs may all be ฿0");
    }

    await page.screenshot({ path: "test-results/bo-auth-02-ceo-dashboard.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("CEO Dashboard JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("BO-AUTH-03: Orders page loads (bug retest #4211)", async ({ page }) => {
    const errors = collectErrors(page);
    await boLogin(page);

    await page.goto(`${BO_URL}/orders`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");

    await page.screenshot({ path: "test-results/bo-auth-03-orders.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("Orders JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("BO-AUTH-04: Customers page loads", async ({ page }) => {
    const errors = collectErrors(page);
    await boLogin(page);

    await page.goto(`${BO_URL}/customers`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");

    await page.screenshot({ path: "test-results/bo-auth-04-customers.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("Customers JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("BO-AUTH-05: All sidebar menus load without error", async ({ page }) => {
    const errors = collectErrors(page);
    await boLogin(page);

    const sidebarPaths = [
      "/dashboard/ceo",
      "/dashboard/support",
      "/dashboard/sales",
      "/dashboard/finance",
      "/dashboard/cto",
      "/orders",
      "/customers",
    ];

    const results: { path: string; status: string; error?: string }[] = [];

    for (const path of sidebarPaths) {
      const response = await page.goto(`${BO_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const body = await page.textContent("body");
      const hasError = body?.includes("Internal Server Error") || body?.includes("ไม่พบหน้าที่คุณต้องการ");

      results.push({
        path,
        status: hasError ? "FAIL" : `PASS (${response?.status()})`,
        error: hasError ? body?.substring(0, 100) : undefined,
      });
    }

    // Log results
    for (const r of results) {
      console.log(`  ${r.status === "FAIL" ? "❌" : "✅"} ${r.path} → ${r.status}`);
    }

    await page.screenshot({ path: "test-results/bo-auth-05-sidebar-nav.png" });

    // All should pass
    const failures = results.filter(r => r.status === "FAIL");
    expect(failures.length).toBe(0);
  });

  test("BO-AUTH-06: Backoffice responsive 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await boLogin(page);

    await page.goto(`${BO_URL}/dashboard/ceo`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );

    await page.screenshot({ path: "test-results/bo-auth-06-responsive-375.png" });

    if (hasOverflow) {
      console.log("⚠️ Backoffice has horizontal overflow at 375px");
    }
  });
});
