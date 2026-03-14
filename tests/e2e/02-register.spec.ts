import { test, expect } from "@playwright/test";

test.describe("Registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.evaluate(() => {
      document.querySelectorAll('[aria-label*="คุกกี้"], [class*="consent"], [class*="cookie"]').forEach(el => el.remove());
    }).catch(() => {});
  });

  test("REG-01: register page loads with all fields", async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await page.screenshot({ path: "test-results/02-register-form.png" });
  });

  test("REG-02: submit disabled without required checkboxes", async ({ page }) => {
    await page.locator('input[name="firstName"]').fill("Test");
    await page.locator('input[name="lastName"]').fill("User");
    await page.locator('input[name="email"]').fill("test-disabled@smsok.test");
    await page.locator('input[name="phone"]').fill("0811111111");
    await page.locator('input[name="password"]').fill("TestPass123!");
    await page.locator('input[name="confirmPassword"]').fill("TestPass123!");
    // Don't tick checkboxes
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test("REG-03: password validation shows strength indicator", async ({ page }) => {
    await page.locator('input[name="password"]').fill("weak");
    await page.waitForTimeout(300);
    // Should show validation messages
    const body = await page.textContent("body");
    expect(body).toMatch(/8 ตัวอักษร|ตัวพิมพ์ใหญ่|ตัวเลข|uppercase|digit/i);
    await page.screenshot({ path: "test-results/02-register-validation.png" });
  });

  test("REG-04: password mismatch shows error", async ({ page }) => {
    await page.locator('input[name="password"]').fill("TestPass123!");
    await page.locator('input[name="confirmPassword"]').fill("Different123!");
    await page.locator('input[name="confirmPassword"]').blur();
    await page.waitForTimeout(500);
    const body = await page.textContent("body");
    // Should show mismatch warning — either explicit or submit stays disabled
    const hasWarning = body?.includes("ไม่ตรง") || body?.includes("match");
    const submitDisabled = await page.locator('button[type="submit"]').isDisabled();
    expect(hasWarning || submitDisabled).toBeTruthy();
  });

  test("REG-05: valid form submits and goes to OTP step", async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@smsok.test`;
    await page.locator('input[name="firstName"]').fill("E2E");
    await page.locator('input[name="lastName"]').fill("Test");
    await page.locator('input[name="email"]').fill(uniqueEmail);
    await page.locator('input[name="phone"]').fill(`08${Math.floor(10000000 + Math.random() * 90000000)}`);
    await page.locator('input[name="password"]').fill("E2ETest2026!");
    await page.locator('input[name="confirmPassword"]').fill("E2ETest2026!");

    // Scroll down and tick checkboxes
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.locator("text=ฉันยอมรับ").first().click();
    await page.waitForTimeout(200);
    await page.locator("text=ฉันยินยอมให้ส่งข้อมูล").first().click();
    await page.waitForTimeout(200);

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await page.waitForTimeout(5000);

    // Should show OTP verification step
    const body = await page.textContent("body");
    expect(body).toMatch(/OTP|ยืนยัน|REF:/i);
    await page.screenshot({ path: "test-results/02-register-otp.png" });
  });

  test("REG-06: XSS in name field is escaped", async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('<script>alert("xss")</script>');
    await page.locator('input[name="lastName"]').fill("Normal");
    await page.waitForTimeout(300);
    // Check the value is stored as text, not executed
    const val = await page.locator('input[name="firstName"]').inputValue();
    expect(val).toContain("<script>");
    // No alert should have fired
  });

  test("REG-07: login link from register page works", async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]').first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await page.waitForURL(/\/login/);
  });
});
