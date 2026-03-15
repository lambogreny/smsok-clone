import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  return errors;
}

async function dismissCookies(page: Page) {
  const acceptBtn = page.getByText("ยอมรับทั้งหมด");
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await dismissCookies(page);

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(USER.email);
  await passwordInput.click();
  await passwordInput.fill(USER.password);

  // Wait for submit button to enable
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(async () => {
    await emailInput.clear();
    await emailInput.type(USER.email);
    await passwordInput.clear();
    await passwordInput.type(USER.password);
  });

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 });
}

test.describe("SMSOK Full Authenticated Smoke", () => {

  test("AUTH-01: Login succeeds → Dashboard", async ({ page }) => {
    const errors = collectErrors(page);
    await login(page);

    expect(page.url()).toContain("/dashboard");
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");

    await page.screenshot({ path: "test-results/auth-01-dashboard.png" });

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    if (jsErrors.length > 0) {
      console.log("Dashboard JS errors:", jsErrors.length);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    }
  });

  test("AUTH-02: Dashboard sidebar navigation", async ({ page }) => {
    const errors = collectErrors(page);
    await login(page);

    const paths = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/contacts",
      "/dashboard/history",
      "/dashboard/senders",
      "/dashboard/templates",
      "/dashboard/settings",
      "/dashboard/packages",
      "/dashboard/orders",
      "/dashboard/api-keys",
    ];

    const results: string[] = [];

    for (const path of paths) {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const body = await page.textContent("body");
      const hasError = body?.includes("Internal Server Error") || body?.includes("ไม่พบหน้าที่คุณต้องการ");
      const status = response?.status() || 0;

      if (hasError || status >= 400) {
        results.push(`❌ ${path} → ${status} ERROR`);
      } else {
        results.push(`✅ ${path} → ${status}`);
      }
    }

    for (const r of results) console.log(r);
    await page.screenshot({ path: "test-results/auth-02-sidebar-nav.png" });

    const failures = results.filter(r => r.startsWith("❌"));
    expect(failures.length).toBe(0);
  });

  test("AUTH-03: Send SMS page loads with form", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should have SMS form elements
    expect(body).toMatch(/ส่ง SMS|ข้อความ|เบอร์|ผู้รับ|Send/i);

    await page.screenshot({ path: "test-results/auth-03-send-sms.png" });
  });

  test("AUTH-04: Contacts page loads", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).toMatch(/สมุดโทรศัพท์|รายชื่อ|Contacts|ผู้ติดต่อ/i);

    await page.screenshot({ path: "test-results/auth-04-contacts.png" });
  });

  test("AUTH-05: History page loads", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/history`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");

    await page.screenshot({ path: "test-results/auth-05-history.png" });
  });

  test("AUTH-06: Settings page loads", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).toMatch(/ตั้งค่า|Settings|โปรไฟล์|Profile/i);

    await page.screenshot({ path: "test-results/auth-06-settings.png" });
  });

  test("AUTH-07: Packages/Pricing page loads", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/packages`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).toMatch(/แพ็กเกจ|Package|SMS|ราคา/i);

    await page.screenshot({ path: "test-results/auth-07-packages.png" });
  });

  test("AUTH-08: Dashboard responsive 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    if (hasOverflow) console.log("⚠️ Dashboard has horizontal overflow at 375px");

    await page.screenshot({ path: "test-results/auth-08-dashboard-375.png" });
  });

  test("AUTH-09: Dashboard responsive 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    if (hasOverflow) console.log("⚠️ Send SMS page has horizontal overflow at 390px");

    await page.screenshot({ path: "test-results/auth-09-sms-390.png" });
  });

  test("AUTH-10: Console errors check across pages", async ({ page }) => {
    const errors = collectErrors(page);
    await login(page);

    const pages = ["/dashboard", "/dashboard/send", "/dashboard/contacts", "/dashboard/settings"];

    for (const path of pages) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    const jsErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("sw.js") && !e.includes("DevTools")
    );

    if (jsErrors.length > 0) {
      console.log(`⚠️ ${jsErrors.length} console errors found across pages:`);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    } else {
      console.log("✅ No console errors across all pages");
    }

    await page.screenshot({ path: "test-results/auth-10-console-check.png" });
  });
});
