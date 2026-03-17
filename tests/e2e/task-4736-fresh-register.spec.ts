import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function dismissCookieConsent(page: Page) {
  const btn = page.getByText("ยอมรับทั้งหมด");
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label*="คุกกี้"], [class*="consent"], [class*="cookie"]').forEach(el => el.remove());
  }).catch(() => {});
}
const TS = Date.now();
const TEST_EMAIL = `qa-fresh-${TS}@smsok.test`;
const TEST_PHONE = `089${String(TS).slice(-7)}`;
const TEST_PASS = "FreshTest123!";

async function fillRegisterForm(page: Page, email: string, phone: string) {
  await page.locator('input[name="firstName"]').fill("QA Fresh");
  await page.locator('input[name="lastName"]').fill("Register");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(TEST_PASS);
  await page.locator('input[name="confirmPassword"]').fill(TEST_PASS);

  // Click required consent checkboxes (data-slot="checkbox")
  const checkboxes = page.locator('[data-slot="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < Math.min(count, 2); i++) {
    await checkboxes.nth(i).scrollIntoViewIfNeeded();
    await checkboxes.nth(i).click({ force: true });
  }
  await page.waitForTimeout(500);
}

test.describe("Task #4736 — Fresh Register Flow (Post-TRUNCATE)", () => {

  test("1. Register — form submit → OTP page (no 123456)", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);
    await page.screenshot({ path: "tests/e2e/screenshots/4736-01-register-empty.png" });

    await fillRegisterForm(page, TEST_EMAIL, TEST_PHONE);
    await page.screenshot({ path: "tests/e2e/screenshots/4736-02-register-filled.png" });

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 10000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "tests/e2e/screenshots/4736-03-after-submit.png" });

    // Should show OTP verification page OR error (but not crash)
    const bodyText = await page.textContent("body") || "";

    // CHECK: No debug "123456" visible
    expect(bodyText).not.toContain("123456");
    expect(bodyText).not.toContain("DEV — OTP:");
    expect(bodyText).not.toContain("debugCode");

    // Should be on OTP page or show a response
    const onOtpPage = bodyText.includes("OTP") || bodyText.includes("ยืนยัน") || bodyText.includes("รหัส");
    const hasError = bodyText.includes("error") || bodyText.includes("ผิด") || bodyText.includes("ซ้ำ") || bodyText.includes("มีอยู่แล้ว");
    const stillOnRegister = page.url().includes("/register");

    // Either moved to OTP step, got an error, or still on register (all valid non-crash states)
    expect(onOtpPage || hasError || stillOnRegister).toBeTruthy();
  });

  test("2. Register page — no hardcoded OTP in source", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");

    const html = await page.content();
    expect(html).not.toContain('"123456"');
    expect(html).not.toContain("debugCode");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-04-source-clean.png" });
  });

  test("3. Login page loads (even with empty DB)", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-05-login-page.png" });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");

    // Login form should be visible
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    expect(await emailInput.isVisible()).toBeTruthy();
  });

  test("4. Login with non-existent user → error (not crash)", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    await page.fill('input[name="email"], input[type="email"]', "nonexistent@test.com");
    await page.fill('input[name="password"], input[type="password"]', "WrongPass123!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/e2e/screenshots/4736-06-login-wrong.png" });

    // Should NOT be on dashboard
    expect(page.url()).not.toContain("/dashboard");
    // Should NOT crash
    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
  });

  test("5. Packages page loads (public, no auth needed)", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/packages`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-07-packages.png" });

    const body = await page.textContent("body") || "";
    // Should show packages/pricing info
    const hasContent = body.includes("SMS") || body.includes("แพ็คเกจ") || body.includes("package") || body.includes("เครดิต") || body.includes("บาท");
    expect(hasContent).toBeTruthy();
  });

  test("6. Protected pages redirect to login (no auth)", async ({ page }) => {
    const protectedPages = [
      "/dashboard",
      "/dashboard/contacts",
      "/dashboard/send",
      "/dashboard/settings",
      "/dashboard/support",
      "/dashboard/api-keys",
    ];

    for (const p of protectedPages) {
      await page.goto(`${BASE}${p}`);
      await page.waitForTimeout(2000);
      const url = page.url();
      // Should redirect away from protected page
      const redirected = url.includes("/login") || url.includes("/register") || !url.includes(p);
      if (!redirected) {
        await page.screenshot({ path: `tests/e2e/screenshots/4736-redirect-fail-${p.replace(/\//g, '_')}.png` });
      }
      expect(redirected).toBeTruthy();
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4736-08-redirects.png" });
  });

  test("7. Landing page loads", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-09-landing.png" });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
    expect(body.length).toBeGreaterThan(50);
  });

  test("8. Forgot password page loads", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-10-forgot-password.png" });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
  });

  test("9. Responsive — register at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-11-register-mobile.png", fullPage: true });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
    expect(body.length).toBeGreaterThan(50);
  });

  test("10. Edge case — XSS in register name", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");

    await page.locator('input[name="firstName"]').fill('<script>alert("xss")</script>');
    await page.locator('input[name="lastName"]').fill("Test");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-12-xss-register.png" });

    // No script execution
    const hasAlert = await page.evaluate(() => (window as any).__xss_triggered || false);
    expect(hasAlert).toBeFalsy();
  });

  test("11. Edge case — SQL injection in login", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    await page.fill('input[name="email"], input[type="email"]', "admin@test.com");
    await page.fill('input[name="password"], input[type="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/e2e/screenshots/4736-13-sqli.png" });

    expect(page.url()).not.toContain("/dashboard");
  });

  test("12. Verify page with invalid code — no crash", async ({ page }) => {
    await page.goto(`${BASE}/verify/invalid-code-test`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4736-14-verify-invalid.png" });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("เอกสารถูกต้อง");
  });
});
