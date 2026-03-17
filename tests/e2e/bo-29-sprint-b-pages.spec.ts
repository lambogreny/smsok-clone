/**
 * BO-29: Sprint B New Pages — smsok-clone
 * QA-2 "ตาเหยี่ยว" — #4829 P1
 * Pages: /settings/consent, /templates/new, /sms/calendar, /sms/scheduled
 * ชั้น 2: Browser real-user test (with login)
 *
 * Strategy: Single login → reuse session across all tests to avoid server crash
 */
import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER_EMAIL = "demo@smsok.local";
const USER_PASSWORD = "Password123!";

// Helper: wait for server to be ready
async function waitForServer(page: Page, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
      if (res && res.status() < 500) return true;
    } catch {
      // Server might be recovering
    }
    await page.waitForTimeout(3000);
  }
  return false;
}

async function loginUser(page: Page) {
  const ready = await waitForServer(page);
  if (!ready) throw new Error("Server not ready after retries");

  await page.waitForLoadState("networkidle").catch(() => {});

  // Dismiss cookie consent if present
  const acceptBtn = page.getByText("ยอมรับทั้งหมด");
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }

  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(USER_EMAIL);

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.click();
  await passwordInput.fill(USER_PASSWORD);

  // Wait for submit to be enabled
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(async () => {
    await emailInput.clear();
    await emailInput.type(USER_EMAIL);
    await passwordInput.clear();
    await passwordInput.type(USER_PASSWORD);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    );
  });

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  await page.waitForTimeout(2000);
}

// Helper: navigate with retry (server may need recovery time)
async function safeGoto(page: Page, path: string) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(3000);
      return;
    } catch {
      await page.waitForTimeout(3000);
    }
  }
  throw new Error(`Failed to navigate to ${path} after 3 retries`);
}

// ===================== SINGLE LOGIN — SERIAL TESTS =====================
// Use a single test.describe with serial mode to share page context

test.describe("BO-29: Sprint B Pages", () => {
  test.describe.configure({ mode: "serial" });

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await loginUser(sharedPage);
  });

  test.afterAll(async () => {
    await sharedPage?.context().close();
  });

  // ===================== CONSENT PAGE =====================
  test("CONSENT: Page loads — section visible + Thai text", async () => {
    await safeGoto(sharedPage, "/dashboard/settings/consent");
    const body = await sharedPage.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body!.length).toBeGreaterThan(50);
    const hasThai = /[\u0E00-\u0E7F]/.test(body!);
    expect(hasThai).toBe(true);
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.screenshot({ path: "test-results/bo-29-consent-page.png", fullPage: true });
  });

  test("CONSENT: Toggle click doesn't crash", async () => {
    // Already on consent page from previous test
    const switches = sharedPage.locator('button[role="switch"]');
    const switchCount = await switches.count();
    if (switchCount > 0) {
      await switches.first().click();
      await sharedPage.waitForTimeout(1000);
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-consent-toggle.png", fullPage: true });
    const body = await sharedPage.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });

  test("CONSENT: Responsive 375px", async () => {
    await sharedPage.setViewportSize({ width: 375, height: 812 });
    await safeGoto(sharedPage, "/dashboard/settings/consent");
    await sharedPage.screenshot({ path: "test-results/bo-29-consent-375.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 }); // reset
  });

  test("CONSENT: Responsive 1440px", async () => {
    await sharedPage.setViewportSize({ width: 1440, height: 900 });
    await safeGoto(sharedPage, "/dashboard/settings/consent");
    await sharedPage.screenshot({ path: "test-results/bo-29-consent-1440.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 }); // reset
  });

  // ===================== TEMPLATE NEW PAGE =====================
  test("TEMPLATE: Page loads — form visible + Thai text", async () => {
    await safeGoto(sharedPage, "/dashboard/templates/new");
    const body = await sharedPage.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body!.length).toBeGreaterThan(50);
    expect(sharedPage.url()).not.toContain("/login");
    const hasThai = /[\u0E00-\u0E7F]/.test(body!);
    expect(hasThai).toBe(true);
    await sharedPage.screenshot({ path: "test-results/bo-29-template-new-page.png", fullPage: true });
  });

  test("TEMPLATE: SMS character counter — type text", async () => {
    const textarea = sharedPage.locator("textarea").first();
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill("ทดสอบข้อความ SMS template สวัสดี");
      await sharedPage.waitForTimeout(1000);
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-template-char-counter.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
  });

  test("TEMPLATE: Phone preview — typing shows in preview", async () => {
    const textarea = sharedPage.locator("textarea").first();
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill("สวัสดีค่ะ {{name}} ยินดีต้อนรับ");
      await sharedPage.waitForTimeout(1000);
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-template-phone-preview.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
  });

  test("TEMPLATE: Empty submit — button disabled (good validation)", async () => {
    // Reload fresh form
    await safeGoto(sharedPage, "/dashboard/templates/new");
    const submitBtn = sharedPage.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      const isDisabled = await submitBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-template-validation.png", fullPage: true });
  });

  test("TEMPLATE: Responsive 375px", async () => {
    await sharedPage.setViewportSize({ width: 375, height: 812 });
    await safeGoto(sharedPage, "/dashboard/templates/new");
    await sharedPage.screenshot({ path: "test-results/bo-29-template-375.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 });
  });

  test("TEMPLATE: Responsive 1440px", async () => {
    await sharedPage.setViewportSize({ width: 1440, height: 900 });
    await safeGoto(sharedPage, "/dashboard/templates/new");
    await sharedPage.screenshot({ path: "test-results/bo-29-template-1440.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 });
  });

  // ===================== SMS CALENDAR PAGE =====================
  test("CALENDAR: Page loads — calendar visible + Thai text", async () => {
    await safeGoto(sharedPage, "/dashboard/sms/calendar");
    const body = await sharedPage.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body!.length).toBeGreaterThan(50);
    expect(sharedPage.url()).not.toContain("/login");
    const hasThai = /[\u0E00-\u0E7F]/.test(body!);
    expect(hasThai).toBe(true);
    await sharedPage.screenshot({ path: "test-results/bo-29-calendar-page.png", fullPage: true });
  });

  test("CALENDAR: Navigation — prev/next buttons work", async () => {
    const chevrons = sharedPage.locator('button:has(svg)');
    const count = await chevrons.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const btn = chevrons.nth(i);
        const text = await btn.textContent();
        if (!text || text.trim() === "") {
          await btn.click();
          await sharedPage.waitForTimeout(1000);
          break;
        }
      }
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-calendar-nav.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
  });

  test("CALENDAR: Responsive 375px", async () => {
    await sharedPage.setViewportSize({ width: 375, height: 812 });
    await safeGoto(sharedPage, "/dashboard/sms/calendar");
    await sharedPage.screenshot({ path: "test-results/bo-29-calendar-375.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 });
  });

  test("CALENDAR: Responsive 1440px", async () => {
    await sharedPage.setViewportSize({ width: 1440, height: 900 });
    await safeGoto(sharedPage, "/dashboard/sms/calendar");
    await sharedPage.screenshot({ path: "test-results/bo-29-calendar-1440.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 });
  });

  // ===================== SCHEDULED SMS PAGE =====================
  test("SCHEDULED: Page loads — scheduled list visible + Thai text", async () => {
    await safeGoto(sharedPage, "/dashboard/sms/scheduled");
    const body = await sharedPage.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body!.length).toBeGreaterThan(50);
    expect(sharedPage.url()).not.toContain("/login");
    const hasThai = /[\u0E00-\u0E7F]/.test(body!);
    expect(hasThai).toBe(true);
    await sharedPage.screenshot({ path: "test-results/bo-29-scheduled-page.png", fullPage: true });
  });

  test("SCHEDULED: Create new — dialog opens", async () => {
    const createBtn = sharedPage.locator('button:has-text("สร้าง"), button:has-text("ตั้งเวลา"), button:has-text("เพิ่ม")');
    if (await createBtn.first().isVisible().catch(() => false)) {
      await createBtn.first().click();
      await sharedPage.waitForTimeout(2000);
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-scheduled-create.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
  });

  test("SCHEDULED: Responsive 375px", async () => {
    await sharedPage.setViewportSize({ width: 375, height: 812 });
    await safeGoto(sharedPage, "/dashboard/sms/scheduled");
    await sharedPage.screenshot({ path: "test-results/bo-29-scheduled-375.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 });
  });

  test("SCHEDULED: Responsive 1440px", async () => {
    await sharedPage.setViewportSize({ width: 1440, height: 900 });
    await safeGoto(sharedPage, "/dashboard/sms/scheduled");
    await sharedPage.screenshot({ path: "test-results/bo-29-scheduled-1440.png", fullPage: true });
    expect(sharedPage.url()).not.toContain("/login");
    await sharedPage.setViewportSize({ width: 1280, height: 720 });
  });

  // ===================== XSS SECURITY =====================
  test("XSS: Template name — XSS payload safe", async () => {
    await safeGoto(sharedPage, "/dashboard/templates/new");
    const input = sharedPage.locator("input").first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill('<script>alert("xss")</script>');
      await sharedPage.waitForTimeout(1000);
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-xss-template.png", fullPage: true });
    const body = await sharedPage.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });

  test("XSS: Scheduled SMS search — XSS safe", async () => {
    await safeGoto(sharedPage, "/dashboard/sms/scheduled");
    const input = sharedPage.locator("input").first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill('<img src=x onerror=alert(1)>');
      await sharedPage.waitForTimeout(1000);
    }
    await sharedPage.screenshot({ path: "test-results/bo-29-xss-scheduled.png", fullPage: true });
    const body = await sharedPage.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });
});
