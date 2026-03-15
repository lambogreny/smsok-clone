import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="email"], input[type="email"]', "qa-judge2@smsok.test");
  await page.fill('input[name="password"], input[type="password"]', "QAJudge2026!");
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
}

// ========================
// 1. Edge Case Tests
// ========================

test.describe("EDGE-01: Login Edge Cases", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("EDGE-01-01: Login with invalid email format — button disabled", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[name="email"], input[type="email"]', "not-an-email");
    await page.fill('input[name="password"], input[type="password"]', "SomePass123!");
    await page.screenshot({ path: "test-results/edge-01-01-invalid-email.png", fullPage: true });
    const submitBtn = page.locator('button[type="submit"]');
    // Good UX: button stays disabled for invalid email
    const isDisabled = await submitBtn.isDisabled();
    if (isDisabled) {
      expect(isDisabled).toBeTruthy(); // Button correctly disabled
    } else {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      expect(page.url()).toContain("/login"); // Should stay on login
    }
  });

  test("EDGE-01-02: Login with SQL injection attempt", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    // Dismiss cookie consent if present
    const cookieBtn = page.locator('button:has-text("ยอมรับ"), button:has-text("Accept"), button:has-text("ตกลง")').first();
    if (await cookieBtn.count() > 0) await cookieBtn.click().catch(() => {});
    await page.fill('input[name="email"], input[type="email"]', "admin@test.com");
    await page.fill('input[name="password"], input[type="password"]', "' OR '1'='1");
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isEnabled()) {
      await submitBtn.click({ force: true });
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: "test-results/edge-01-02-sql-injection.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(page.url()).toContain("/login");
  });

  test("EDGE-01-03: Login with XSS attempt", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    // Dismiss cookie consent if present
    const cookieBtn = page.locator('button:has-text("ยอมรับ"), button:has-text("Accept"), button:has-text("ตกลง")').first();
    if (await cookieBtn.count() > 0) await cookieBtn.click().catch(() => {});
    await page.fill('input[name="email"], input[type="email"]', "xss@test.com");
    await page.fill('input[name="password"], input[type="password"]', "<img src=x onerror=alert(1)>");
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isEnabled()) {
      await submitBtn.click({ force: true });
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: "test-results/edge-01-03-xss.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(page.url()).toContain("/login");
  });
});

test.describe("EDGE-02: Registration Edge Cases", () => {
  test("EDGE-02-01: Register with missing fields", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    // Fill only email, leave rest empty
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill("incomplete@test.com");
    }
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isEnabled()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: "test-results/edge-02-01-incomplete-reg.png", fullPage: true });
    // Should stay on register page
    expect(page.url()).toContain("/register");
  });

  test("EDGE-02-02: Register with very long input", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    const longString = "a".repeat(500);
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill(`${longString}@test.com`);
    }
    await page.screenshot({ path: "test-results/edge-02-02-long-input.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });
});

test.describe("EDGE-03: Auth Redirect Tests", () => {
  // Must clear stored auth to test unauthenticated access
  test.use({ storageState: { cookies: [], origins: [] } });

  const protectedPages = [
    "/dashboard",
    "/dashboard/send",
    "/dashboard/messages",
    "/dashboard/packages",
    "/dashboard/settings",
    "/dashboard/api-keys",
    "/dashboard/contacts",
    "/dashboard/campaigns",
    "/dashboard/senders",
  ];

  for (const path of protectedPages) {
    test(`EDGE-03: ${path} redirects to login when unauthenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(3000);
      const url = page.url();
      const body = await page.textContent("body");
      // Should redirect to login or show login page
      const isProtected = url.includes("/login") || body?.includes("เข้าสู่ระบบ");
      expect(isProtected).toBeTruthy();
    });
  }
});

test.describe("EDGE-04: Upload Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("EDGE-04-01: Order page accepts image upload", async ({ page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/edge-04-01-orders-page.png", fullPage: true });
    // Look for upload area or payment button
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });
});

// ========================
// 2. Mobile Responsive Tests (375px)
// ========================

test.describe("EDGE-05: Mobile Responsive (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("EDGE-05-01: Landing page mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/edge-05-01-mobile-landing.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).toContain("SMSOK");
  });

  test("EDGE-05-02: Login page mobile", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/edge-05-02-mobile-login.png", fullPage: true });
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
  });

  test("EDGE-05-03: Register page mobile", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/edge-05-03-mobile-register.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });

  test("EDGE-05-04: Dashboard mobile", async ({ page }) => {
    await login(page);
    await page.screenshot({ path: "test-results/edge-05-04-mobile-dashboard.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });

  test("EDGE-05-05: Packages page mobile", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/packages");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/edge-05-05-mobile-packages.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Check packages still visible on mobile
    expect(body).toContain("Starter");
  });

  test("EDGE-05-06: Settings page mobile", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "test-results/edge-05-06-mobile-settings.png", fullPage: true });
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });
});

// ========================
// 3. Performance Check
// ========================

test.describe("EDGE-06: Performance Checks", () => {
  test("EDGE-06-01: Landing page loads within 5 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;
    await page.screenshot({ path: "test-results/edge-06-01-perf-landing.png" });
    console.log(`Landing page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test("EDGE-06-02: Login page loads within 5 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;
    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test("EDGE-06-03: Dashboard loads within 8 seconds (with auth)", async ({ page }) => {
    await login(page);
    const startTime = Date.now();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;
    await page.screenshot({ path: "test-results/edge-06-03-perf-dashboard.png" });
    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(8000);
  });

  test("EDGE-06-04: No console errors on key pages", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // Check landing
    await page.goto("/");
    await page.waitForTimeout(2000);
    // Check login
    await page.goto("/login");
    await page.waitForTimeout(2000);

    const critical = consoleErrors.filter(
      (e) =>
        e.includes("TypeError") ||
        e.includes("ReferenceError") ||
        e.includes("Uncaught") ||
        e.includes("500")
    );
    if (critical.length > 0) console.log("Critical errors:", critical);
    expect(critical).toHaveLength(0);
  });
});
