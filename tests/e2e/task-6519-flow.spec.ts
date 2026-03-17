/**
 * Task #6519 — Register → Login → Dashboard flow
 * Screenshot ทุก step
 */
import { test as base, expect } from "@playwright/test";
import { dismissCookieConsent, TEST_USER } from "./fixtures";

const SS = "tests/screenshots/task-6519";
const test = base;

test.describe("Register → Login → Dashboard Flow", () => {
  test("Step 1: Register new user", async ({ page }) => {
    await page.goto("http://localhost:3000/register", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/01-register-page.png`, fullPage: true });

    const body = await page.textContent("body");
    const hasForm = body?.includes("สมัครสมาชิก") || body?.includes("สมัคร") || body?.includes("Register");
    console.log(`Register page loaded: ${hasForm}`);
    console.log(`URL: ${page.url()}`);

    // Find form fields
    const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="เบอร์"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    const ts = Date.now();
    const testEmail = `qa-flow-${ts}@smsok.test`;
    const testPhone = `09${String(ts).slice(-8)}`;

    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill("QA Flow Test");
      console.log("✅ Name filled");
    }
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(testEmail);
      console.log(`✅ Email filled: ${testEmail}`);
    }
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill(testPhone);
      console.log(`✅ Phone filled: ${testPhone}`);
    }
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordInput.fill("QATest123!");
      console.log("✅ Password filled");
    }

    // Fill confirm password if exists
    const confirmPw = page.locator('input[type="password"]').nth(1);
    if (await confirmPw.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPw.fill("QATest123!");
      console.log("✅ Confirm password filled");
    }

    await page.screenshot({ path: `${SS}/02-register-filled.png`, fullPage: true });

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Check if enabled
      const disabled = await submitBtn.isDisabled();
      console.log(`Submit button disabled: ${disabled}`);
      if (!disabled) {
        await submitBtn.click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: `${SS}/03-register-after-submit.png`, fullPage: true });
        console.log(`After submit URL: ${page.url()}`);
        const afterBody = await page.textContent("body");
        console.log(`After submit body (200 chars): ${afterBody?.substring(0, 200)}`);
      }
    }
  });

  test("Step 2: Login with existing user", async ({ page }) => {
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/04-login-page.png`, fullPage: true });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    await page.screenshot({ path: `${SS}/05-login-filled.png`, fullPage: true });

    // Wait for button to be enabled
    const submitBtn = page.locator('button[type="submit"]');
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(async () => {
      // Retry typing
      await emailInput.clear();
      await emailInput.type(TEST_USER.email);
      await passwordInput.clear();
      await passwordInput.type(TEST_USER.password);
      await page.waitForFunction(
        () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
        { timeout: 5000 }
      );
    });

    await submitBtn.click();
    console.log("✅ Login submitted");

    // Wait for navigation
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(async () => {
      console.log(`❌ Did not redirect to dashboard. URL: ${page.url()}`);
      await page.screenshot({ path: `${SS}/05-login-stuck.png`, fullPage: true });
      const body = await page.textContent("body");
      console.log(`Page content: ${body?.substring(0, 300)}`);
    });

    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/06-dashboard-after-login.png`, fullPage: true });

    console.log(`Final URL: ${page.url()}`);
    const dashBody = await page.textContent("body");
    console.log(`Dashboard has ภาพรวม: ${dashBody?.includes("ภาพรวม")}`);
    console.log(`Dashboard has KPI: ${dashBody?.includes("SMS")}`);

    expect(page.url()).toContain("/dashboard");
  });

  test("Step 3: Dashboard content check", async ({ page }) => {
    // Login first
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);

    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(async () => {
      await emailInput.clear();
      await emailInput.type(TEST_USER.email);
      await passwordInput.clear();
      await passwordInput.type(TEST_USER.password);
      await page.waitForFunction(
        () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
        { timeout: 5000 }
      );
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Check sidebar links
    const sidebarLinks = page.locator('nav a[href*="/dashboard"]');
    const linkCount = await sidebarLinks.count();
    console.log(`Sidebar links: ${linkCount}`);

    // Check KPI cards
    await page.screenshot({ path: `${SS}/07-dashboard-content.png`, fullPage: true });

    const body = await page.textContent("body");
    console.log(`Has ภาพรวม: ${body?.includes("ภาพรวม")}`);
    console.log(`Has SMS: ${body?.includes("SMS")}`);
    console.log(`Has sidebar: ${linkCount > 5}`);

    expect(body).toContain("ภาพรวม");
  });
});
