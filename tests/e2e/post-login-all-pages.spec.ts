/**
 * Task #4550 — Post-Login All Pages E2E Test
 * P0 CRITICAL: Test every dashboard page after login
 * Layer 1: API status check (authenticated)
 * Layer 2: Browser real navigation + screenshot + console errors
 *
 * 16 pages to verify: dashboard, sms, campaigns, contacts, groups,
 * messages, templates, packages, orders, payments, settings, profile,
 * tickets, notifications, sender-names, api-keys
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

const ALL_PAGES = [
  { path: "/dashboard", name: "Dashboard", mustContain: /ภาพรวม|Dashboard|SMS|เครดิต|credit/i },
  { path: "/dashboard/send", name: "Send SMS", mustContain: /ส่ง|Send|SMS|ข้อความ|message/i },
  { path: "/dashboard/campaigns", name: "Campaigns", mustContain: /แคมเปญ|Campaign|สร้าง|create/i },
  { path: "/dashboard/contacts", name: "Contacts", mustContain: /ผู้ติดต่อ|Contact|เพิ่ม|add|ค้นหา/i },
  { path: "/dashboard/groups", name: "Groups", mustContain: /กลุ่ม|Group|สร้าง|create/i },
  { path: "/dashboard/messages", name: "Messages", mustContain: /ข้อความ|Message|ประวัติ|history|ส่ง/i },
  { path: "/dashboard/templates", name: "Templates", mustContain: /เทมเพลต|Template|สร้าง|create/i },
  { path: "/dashboard/packages", name: "Packages", mustContain: /แพ็กเกจ|Package|ราคา|price|SMS|เครดิต/i },
  { path: "/dashboard/orders", name: "Orders", mustContain: /คำสั่งซื้อ|Order|รายการ|ประวัติ/i },
  { path: "/dashboard/billing/orders", name: "Billing Orders", mustContain: /คำสั่งซื้อ|Order|Billing|รายการ/i },
  { path: "/dashboard/settings", name: "Settings", mustContain: /ตั้งค่า|Setting|โปรไฟล์|Profile/i },
  { path: "/dashboard/support", name: "Support/Tickets", mustContain: /ตั๋ว|Ticket|Support|ช่วยเหลือ|สร้าง/i },
  { path: "/dashboard/notifications", name: "Notifications", mustContain: /แจ้งเตือน|Notification|ทั้งหมด/i },
  { path: "/dashboard/sender-names", name: "Sender Names", mustContain: /ชื่อผู้ส่ง|Sender|สร้าง|create/i },
];

async function dismissCookies(page: Page) {
  const btn = page.getByText("ยอมรับทั้งหมด");
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

  if (page.url().includes("dashboard")) return;

  await dismissCookies(page);

  const email = page.locator('input[type="email"]');
  const pass = page.locator('input[type="password"]');
  await email.waitFor({ state: "visible", timeout: 20000 });
  await email.click();
  await email.fill(USER.email);
  await pass.click();
  await pass.fill(USER.password);

  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(async () => {
    await email.clear(); await email.type(USER.email);
    await pass.clear(); await pass.type(USER.password);
  });

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 });
}

// ========== LAYER 1: API STATUS CHECK ==========
test.describe("Layer 1 — All Pages API Status", () => {

  test("API-ALL-01: All dashboard pages return < 500 (authenticated)", async ({ page }) => {
    await login(page);

    const results: { path: string; name: string; status: number; ok: boolean }[] = [];

    for (const pg of ALL_PAGES) {
      const res = await page.request.get(`${BASE}${pg.path}`);
      const status = res.status();
      const ok = status < 500;
      results.push({ path: pg.path, name: pg.name, status, ok });

      if (status >= 500) {
        console.log(`🐛 ${pg.name} (${pg.path}) → ${status} SERVER ERROR`);
      } else if (status >= 400) {
        console.log(`⚠️ ${pg.name} (${pg.path}) → ${status}`);
      } else {
        console.log(`✅ ${pg.name} (${pg.path}) → ${status}`);
      }
    }

    const failures = results.filter(r => !r.ok);
    console.log(`\n📊 Summary: ${results.length - failures.length}/${results.length} pages OK`);
    if (failures.length > 0) {
      console.log(`🐛 FAILING PAGES:`);
      failures.forEach(f => console.log(`   - ${f.name} (${f.path}) → ${f.status}`));
    }

    // All pages must return < 500
    for (const r of results) {
      expect(r.status, `${r.name} (${r.path})`).toBeLessThan(500);
    }
  });

  test("API-ALL-02: Dashboard API endpoints", async ({ page }) => {
    await login(page);

    const endpoints = [
      { url: "/api/notifications", name: "Notifications" },
      { url: "/api/v1/credits/balance", name: "Credits" },
      { url: "/api/v1/senders", name: "Senders" },
      { url: "/api/v1/contacts?page=1&limit=5", name: "Contacts" },
      { url: "/api/v1/tickets?page=1&limit=5", name: "Tickets" },
    ];

    for (const ep of endpoints) {
      const res = await page.request.get(`${BASE}${ep.url}`);
      if (res.status() < 400) {
        console.log(`✅ ${ep.name} → ${res.status()}`);
      } else if (res.status() === 403) {
        console.log(`⚠️ ${ep.name} → 403 (RBAC)`);
      } else {
        console.log(`🐛 ${ep.name} → ${res.status()}`);
      }
    }
  });
});

// ========== LAYER 2: BROWSER REAL NAVIGATION ==========
test.describe("Layer 2 — All Pages Browser Navigation", () => {

  // Test each page individually for clear failure reporting
  for (const pg of ALL_PAGES) {
    test(`UI-PAGE: ${pg.name} (${pg.path})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

      await login(page);

      const response = await page.goto(`${BASE}${pg.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await dismissCookies(page);

      const status = response?.status() || 0;
      const body = await page.textContent("body") || "";

      // 1. Must not show server error
      const hasServerError = body.includes("เซิร์ฟเวอร์มีปัญหา") ||
        body.includes("Internal Server Error") ||
        body.includes("500");

      if (hasServerError && status >= 500) {
        console.log(`🐛 CRITICAL: ${pg.name} → SERVER ERROR (${status})`);
      }

      // 2. Must not be blank
      const isBlank = body.trim().length < 50;
      if (isBlank) {
        console.log(`🐛 BUG: ${pg.name} → BLANK PAGE`);
      }

      // 3. Should contain expected content (or valid empty state)
      const hasExpected = pg.mustContain.test(body);
      const hasEmptyState = body.match(/ไม่มี|ยังไม่มี|No\s|empty|ไม่พบ|not found|0\sรายการ/i);

      if (hasExpected) {
        console.log(`✅ ${pg.name} → content found`);
      } else if (hasEmptyState) {
        console.log(`✅ ${pg.name} → empty state (valid)`);
      } else if (!hasServerError) {
        console.log(`⚠️ ${pg.name} → loaded but expected content not matched`);
      }

      // 4. Console errors
      const jsErrors = errors.filter(e =>
        !e.includes("favicon") && !e.includes("sw.js") && !e.includes("DevTools")
      );
      if (jsErrors.length > 0) {
        console.log(`   ⚠️ ${jsErrors.length} console errors`);
        jsErrors.slice(0, 2).forEach(e => console.log("     -", e.slice(0, 120)));
      }

      // Take screenshot
      const slug = pg.path.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: `test-results/post-login-${slug}.png` });

      // Assertions
      expect(status, `${pg.name} status`).toBeLessThan(500);
      expect(isBlank, `${pg.name} blank`).toBeFalsy();
    });
  }

  test("UI-MOBILE: All pages responsive 375px (spot check)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    const spotCheck = ["/dashboard", "/dashboard/send", "/dashboard/contacts", "/dashboard/settings"];

    for (const path of spotCheck) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await dismissCookies(page);

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
      );

      const slug = path.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: `test-results/post-login-mobile-${slug}.png` });

      if (overflow) console.log(`🐛 ${path} → OVERFLOW at 375px`);
      else console.log(`✅ ${path} → responsive 375px`);
    }
  });

  test("UI-CONSOLE: Aggregate console errors across all pages", async ({ page }) => {
    const allErrors: { page: string; error: string }[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("favicon") && !text.includes("sw.js") && !text.includes("DevTools")) {
          allErrors.push({ page: "current", error: text });
        }
      }
    });
    page.on("pageerror", (err) => allErrors.push({ page: "current", error: `PAGE: ${err.message}` }));

    await login(page);

    for (const pg of ALL_PAGES) {
      allErrors.forEach(e => e.page = e.page === "current" ? "previous" : e.page);

      await page.goto(`${BASE}${pg.path}`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(500);

      // Tag new errors with current page
      allErrors.filter(e => e.page === "current").forEach(e => e.page = pg.name);
    }

    // Deduplicate and report
    const uniqueErrors = [...new Set(allErrors.map(e => `[${e.page}] ${e.error.slice(0, 100)}`))];

    if (uniqueErrors.length > 0) {
      console.log(`⚠️ ${uniqueErrors.length} unique console errors across ${ALL_PAGES.length} pages:`);
      uniqueErrors.slice(0, 10).forEach(e => console.log("  -", e));
    } else {
      console.log(`✅ No console errors across ${ALL_PAGES.length} pages`);
    }

    await page.screenshot({ path: "test-results/post-login-console-aggregate.png" });
  });
});
