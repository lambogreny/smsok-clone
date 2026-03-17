import { test, expect, type Page, devices } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_USER = { email: "qa-suite@smsok.test", password: "QATest123!" };

async function dismissCookies(page: Page) {
  for (const text of ["ยอมรับทั้งหมด", "ยอมรับ", "Accept All"]) {
    const btn = page.getByText(text, { exact: false });
    if (await btn.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.first().click({ force: true });
      await page.waitForTimeout(500);
      return;
    }
  }
  const dialog = page.locator('[role="dialog"][aria-label*="คุกกี้"]');
  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await dialog.locator("button").first().click({ force: true }).catch(() => {});
  }
}

async function snap(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/xbrowser-${name}.png`, fullPage: true });
}

async function loginAndTest(page: Page, browserName: string) {
  const results: { test: string; status: string; detail?: string }[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("hydrat")) {
      consoleErrors.push(msg.text().substring(0, 150));
    }
  });

  // 1. Login page render
  await page.goto(`${BASE}/login`, { timeout: 20000 });
  await dismissCookies(page);
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, `${browserName}-login`);

  const emailInput = page.locator('input[type="email"]');
  const pwInput = page.locator('input[type="password"]');
  const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  const pwVisible = await pwInput.isVisible({ timeout: 3000 }).catch(() => false);
  results.push({ test: "Login form render", status: emailVisible && pwVisible ? "PASS" : "FAIL" });

  // 2. Login flow
  if (emailVisible && pwVisible) {
    await emailInput.fill(QA_USER.email);
    await pwInput.fill(QA_USER.password);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(() => {});
    await page.locator('button[type="submit"]').click({ force: true });
    await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const onDashboard = page.url().includes("/dashboard");
    results.push({ test: "Login → Dashboard", status: onDashboard ? "PASS" : "FAIL", detail: page.url() });

    if (onDashboard) {
      // 3. Dashboard render
      await snap(page, `${browserName}-dashboard`);
      const bodyText = await page.locator("body").textContent().catch(() => "") || "";
      const hasSidebar = bodyText.includes("ภาพรวม") || bodyText.includes("ส่ง SMS");
      const hasKPI = bodyText.includes("SMS") && bodyText.includes("0");
      results.push({ test: "Dashboard sidebar", status: hasSidebar ? "PASS" : "FAIL" });
      results.push({ test: "Dashboard KPI cards", status: hasKPI ? "PASS" : "FAIL" });

      // Check horizontal overflow
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      results.push({ test: "No horizontal overflow", status: !overflow ? "PASS" : "FAIL" });

      // 4. Contacts table render
      await page.goto(`${BASE}/dashboard/contacts`, { timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await snap(page, `${browserName}-contacts`);

      const tableVisible = await page.locator("table, [role='table'], [class*='table']").first().isVisible({ timeout: 5000 }).catch(() => false);
      results.push({ test: "Contacts table render", status: tableVisible ? "PASS" : "FAIL" });

      // 5. Packages page render
      await page.goto(`${BASE}/dashboard/packages`, { timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await snap(page, `${browserName}-packages`);

      const pkgText = await page.locator("body").textContent().catch(() => "") || "";
      const hasPkgCards = pkgText.includes("Starter") || pkgText.includes("Basic") || pkgText.includes("แพ็กเกจ");
      results.push({ test: "Packages cards render", status: hasPkgCards ? "PASS" : "FAIL" });

      // 6. Settings page render
      await page.goto(`${BASE}/dashboard/settings`, { timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await snap(page, `${browserName}-settings`);

      const settingsText = await page.locator("body").textContent().catch(() => "") || "";
      const hasSettingsTabs = settingsText.includes("โปรไฟล์") || settingsText.includes("ตั้งค่า") || settingsText.includes("Profile");
      results.push({ test: "Settings page render", status: hasSettingsTabs ? "PASS" : "FAIL" });

      // 7. Font check
      const fontFamily = await page.evaluate(() => {
        const body = document.querySelector("body");
        return body ? getComputedStyle(body).fontFamily : "unknown";
      });
      const hasExpectedFont = fontFamily.includes("Inter") || fontFamily.includes("IBM") || fontFamily.includes("sans-serif");
      results.push({ test: "Font loaded", status: hasExpectedFont ? "PASS" : "CHECK", detail: fontFamily.substring(0, 60) });

      // 8. History page
      await page.goto(`${BASE}/dashboard/history`, { timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await snap(page, `${browserName}-history`);

      const historyText = await page.locator("body").textContent().catch(() => "") || "";
      const hasHistory = historyText.includes("ประวัติ") || historyText.includes("History");
      results.push({ test: "History page render", status: hasHistory ? "PASS" : "FAIL" });
    }
  }

  // Print results
  console.log(`\n${"=".repeat(60)}`);
  console.log(`CROSS-BROWSER: ${browserName}`);
  console.log(`${"=".repeat(60)}`);
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : "⚠️";
    console.log(`${icon} ${r.test.padEnd(30)} ${r.status} ${r.detail || ""}`);
  }
  console.log(`Result: ${passed}/${results.length} PASS, ${failed} FAIL`);
  if (consoleErrors.length > 0) {
    console.log(`Console errors: ${consoleErrors.length}`);
    for (const e of consoleErrors.slice(0, 3)) console.log(`  ⚠️ ${e}`);
  }
  console.log(`${"=".repeat(60)}\n`);

  return { passed, failed, total: results.length };
}

// ===================== CHROME (Desktop) =====================
test("Chrome Desktop", async ({ browser }) => {
  const ctx = await browser.newContext({
    ...devices["Desktop Chrome"],
  });
  const page = await ctx.newPage();
  await loginAndTest(page, "chrome-desktop");
  await ctx.close();
});

// ===================== SAFARI (WebKit) =====================
test("Safari WebKit", async ({ browserName }) => {
  // This test uses the default browser but simulates webkit behavior
  const pw = require("playwright");
  const browser = await pw.webkit.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  });
  const page = await ctx.newPage();
  await loginAndTest(page, "safari-webkit");
  await browser.close();
});

// ===================== FIREFOX =====================
test("Firefox Gecko", async () => {
  const pw = require("playwright");
  const browser = await pw.firefox.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await ctx.newPage();
  await loginAndTest(page, "firefox-gecko");
  await browser.close();
});

// ===================== MOBILE CHROME (375px) =====================
test("Mobile Chrome 375px", async () => {
  const pw = require("playwright");
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
  });
  const page = await ctx.newPage();
  await loginAndTest(page, "mobile-375");
  await browser.close();
});

// ===================== IPAD (768px) =====================
test("iPad Tablet 768px", async () => {
  const pw = require("playwright");
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({
    ...devices["iPad (gen 7)"],
  });
  const page = await ctx.newPage();
  await loginAndTest(page, "ipad-768");
  await browser.close();
});
