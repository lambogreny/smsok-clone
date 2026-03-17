import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

async function fillRegisterForm(page: import("@playwright/test").Page, prefix: string) {
  const ts = Date.now();
  await page.locator('input[name="firstName"]').fill(`${prefix} Test`);
  await page.locator('input[name="lastName"]').fill("User");
  await page.locator('input[name="email"]').fill(`${prefix.toLowerCase()}-${ts}@smsok.test`);
  await page.locator('input[name="phone"]').fill(`089${String(ts).slice(-7)}`);
  await page.locator('input[name="password"]').fill("TestPass123!");
  await page.locator('input[name="confirmPassword"]').fill("TestPass123!");

  // Click first 2 checkboxes (required: consentService, consentThirdParty)
  // Uses data-slot="checkbox" from base-ui Checkbox component
  const checkboxes = page.locator('[data-slot="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < Math.min(count, 2); i++) {
    await checkboxes.nth(i).scrollIntoViewIfNeeded();
    await checkboxes.nth(i).click({ force: true });
  }

  // Wait for form to recognize changes
  await page.waitForTimeout(500);
}

test.describe("Task #4691 — OTP Fix Verification", () => {
  test("1. Register page — no debug OTP code visible", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4691-register-initial.png" });

    await fillRegisterForm(page, "OTPCheck");

    await page.screenshot({ path: "tests/e2e/screenshots/4691-register-filled.png" });

    // Submit to get OTP step
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 10000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "tests/e2e/screenshots/4691-after-submit.png" });

    // CHECK: No "123456" visible on page (debug OTP removed)
    const bodyText = await page.textContent("body") || "";
    expect(bodyText).not.toContain("123456");

    // CHECK: No "DEV — OTP:" debug banner
    expect(bodyText).not.toContain("DEV — OTP:");
    expect(bodyText).not.toContain("debugCode");

    // CHECK: No debug code display element
    const debugBanner = page.locator('text=DEV — OTP');
    expect(await debugBanner.isVisible({ timeout: 1000 }).catch(() => false)).toBeFalsy();
  });

  test("2. Wrong OTP → must reject", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");

    await fillRegisterForm(page, "WrongOTP");

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 10000 });
    await page.waitForTimeout(3000);

    // If OTP step appeared, enter wrong code
    const otpInput = page.locator('input[name="otpCode"], input[name="otp"], input[placeholder*="OTP"], input[maxlength="6"]').first();
    if (await otpInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await otpInput.fill("000000");

      // Submit wrong OTP
      const verifyBtn = page.locator('button:has-text("ยืนยัน"), button:has-text("Verify"), button[type="submit"]').first();
      if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
        await page.waitForTimeout(2000);
      }

      await page.screenshot({ path: "tests/e2e/screenshots/4691-wrong-otp.png" });

      // Should show error or not proceed to dashboard
      const bodyText = await page.textContent("body") || "";
      const hasError = bodyText.includes("ผิด") || bodyText.includes("ไม่ถูกต้อง") || bodyText.includes("invalid") || bodyText.includes("error") || bodyText.includes("หมดอายุ") || bodyText.includes("ล้มเหลว");
      const notOnDashboard = !page.url().includes("/dashboard");
      expect(hasError || notOnDashboard).toBeTruthy();
    } else {
      // OTP step might not have appeared — take screenshot for evidence
      await page.screenshot({ path: "tests/e2e/screenshots/4691-no-otp-step.png" });
      // If no OTP step, check we're not on dashboard (form validation blocked)
      expect(page.url()).not.toContain("/dashboard");
    }
  });

  test("3. Register page source — no hardcoded 123456", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");

    // Check page source doesn't contain hardcoded OTP
    const html = await page.content();
    expect(html).not.toContain('"123456"');
    expect(html).not.toContain("debugCode");
  });
});
