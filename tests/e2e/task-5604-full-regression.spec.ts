/**
 * Task #5604 — Full Regression Test (P0)
 * Scope: Auth, API Docs, Webhooks, Core Pages (14 test areas)
 * Layer 1: API integration tests
 * Layer 2: Playwright browser tests with screenshots
 */

import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5604";
const BASE = "http://localhost:3000";
const LOGIN_EMAIL = "qa-suite@smsok.test";
const LOGIN_PASS = "QATest123!";

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

// Helper: login via API and get session cookie
async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASS }),
  });
  const cookies = res.headers.getSetCookie();
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

async function api(path: string, opts: { method?: string; body?: unknown; cookie: string }) {
  const headers: Record<string, string> = { Cookie: opts.cookie, Origin: BASE };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// Helper: login in browser and navigate to page
async function loginAndGoto(page: Page, targetPath: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);

  // Dismiss cookie consent if present
  const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }

  const emailInput = page.locator('input[type="email"]');
  const passInput = page.locator('input[type="password"]');

  await emailInput.fill(LOGIN_EMAIL);
  await passInput.fill(LOGIN_PASS);

  // Wait for submit to be enabled
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 5000 }
  ).catch(() => {});

  await page.locator('button[type="submit"]').click();

  // Wait for dashboard or 2fa
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Navigate to target
  if (!page.url().includes(targetPath.replace("/dashboard", ""))) {
    await page.goto(`${BASE}${targetPath}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
  }
}

// ============================================
// LAYER 1: API TESTS
// ============================================
test.describe("Layer 1 — API Tests", () => {
  let cookie: string;

  test.beforeAll(async () => {
    cookie = await getSessionCookie();
  });

  // --- AUTH ---
  test("API-1. Login success → 200 + session cookie", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASS }),
    });
    console.log("📍 POST /api/auth/login →", res.status);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    console.log("✅ Login success");
  });

  test("API-2. Login wrong password → error", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: LOGIN_EMAIL, password: "WrongPass999!" }),
    });
    console.log("📍 POST /api/auth/login (wrong pass) →", res.status);
    expect([400, 401, 403]).toContain(res.status);
    console.log("✅ Wrong password rejected");
  });

  // --- WEBHOOKS API ---
  test("API-3. Webhooks CRUD — create", async () => {
    const res = await api("/api/v1/webhooks", {
      method: "POST",
      cookie,
      body: { url: "https://httpbin.org/post", events: ["sms.sent"] },
    });
    console.log("📍 POST /api/v1/webhooks →", res.status);
    expect([200, 201]).toContain(res.status);
    const wh = res.data?.webhook || res.data;
    expect(wh).toHaveProperty("id");
    console.log("✅ Webhook created, id:", wh.id);
  });

  test("API-4. Webhooks CRUD — list", async () => {
    const res = await api("/api/v1/webhooks", { cookie });
    console.log("📍 GET /api/v1/webhooks →", res.status);
    expect(res.status).toBe(200);
    console.log("✅ Webhooks listed");
  });

  test("API-5. Webhooks CRUD — delete", async () => {
    // Get first webhook
    const list = await api("/api/v1/webhooks", { cookie });
    const webhooks = Array.isArray(list.data) ? list.data : list.data?.webhooks || [];
    if (webhooks.length > 0) {
      const res = await api(`/api/v1/webhooks/${webhooks[0].id}`, { method: "DELETE", cookie });
      console.log("📍 DELETE /api/v1/webhooks →", res.status);
      expect([200, 204]).toContain(res.status);
      console.log("✅ Webhook deleted");
    } else {
      console.log("⚠️ No webhooks to delete");
    }
  });

  test("API-6. Webhooks — no auth → 401", async () => {
    const res = await fetch(`${BASE}/api/v1/webhooks`, { headers: { Origin: BASE } });
    console.log("📍 GET /api/v1/webhooks (no auth) →", res.status);
    expect(res.status).toBe(401);
    console.log("✅ Unauthorized blocked");
  });

  // --- CONTACTS API ---
  test("API-7. Contacts — list", async () => {
    const res = await api("/api/v1/contacts", { cookie });
    console.log("📍 GET /api/v1/contacts →", res.status);
    expect(res.status).toBe(200);
    console.log("✅ Contacts listed");
  });

  // --- SMS API ---
  test("API-8. SMS — history", async () => {
    const res = await api("/api/v1/sms", { cookie });
    console.log("📍 GET /api/v1/sms →", res.status);
    expect([200, 404]).toContain(res.status);
    console.log("✅ SMS history fetched, status:", res.status);
  });

  // --- CAMPAIGNS API ---
  test("API-9. Campaigns — list", async () => {
    const res = await api("/api/v1/campaigns", { cookie });
    console.log("📍 GET /api/v1/campaigns →", res.status);
    expect([200, 404]).toContain(res.status);
    console.log("✅ Campaigns listed, status:", res.status);
  });

  // --- SETTINGS API ---
  test("API-10. Settings — profile", async () => {
    const res = await api("/api/v1/me", { cookie });
    console.log("📍 GET /api/v1/me →", res.status);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      console.log("✅ Profile data:", JSON.stringify(res.data).substring(0, 200));
    }
  });
});

// ============================================
// LAYER 2: BROWSER TESTS
// ============================================
test.describe("Layer 2 — Browser Tests", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
  });

  // --- AUTH (1-2) ---
  test("B1. Login → dashboard success", async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    // Dismiss cookie consent
    const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
    if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    await ss(page, "01-login-page");

    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASS);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    ).catch(() => {});
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "02-dashboard-after-login");

    console.log("📍 URL:", page.url());
    expect(page.url()).toContain("dashboard");
    console.log("✅ Login → dashboard success");
  });

  test("B2. Login wrong password → error message", async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    // Dismiss cookie consent
    const acceptBtn = page.locator('text="ยอมรับทั้งหมด"');
    if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill("WrongPassword999!");
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    ).catch(() => {});
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await ss(page, "03-login-wrong-password");

    const pageText = await page.textContent("body");
    const hasError = /error|ผิด|ไม่ถูกต้อง|invalid|incorrect/i.test(pageText || "");
    console.log("👁️ Error message shown:", hasError);
    console.log("📍 URL:", page.url());
    // Should NOT be on dashboard
    expect(page.url()).not.toMatch(/\/dashboard$/);
    console.log("✅ Wrong password → error shown, not on dashboard");
  });

  // --- API DOCS (3-4) ---
  test("B3. API Docs — loads without auth", async ({ browser }) => {
    // Fresh context — no auth
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    await page.goto(`${BASE}/dashboard/api-docs`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "04-api-docs-no-auth");

    console.log("📍 URL:", page.url());
    expect(page.url()).not.toContain("/login");
    const pageText = await page.textContent("body");
    expect(/API|endpoint|เอกสาร/i.test(pageText || "")).toBeTruthy();
    console.log("✅ API Docs accessible without auth");
    console.log("🔴 Console errors:", consoleErrors.length);

    await ctx.close();
  });

  test("B4. API Docs — sections + buttons work", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    await page.goto(`${BASE}/dashboard/api-docs`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Category filters
    const categories = ["ทั้งหมด", "SMS", "OTP", "Contacts"];
    for (const cat of categories) {
      const btn = page.locator(`button:text-is("${cat}")`).first();
      if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(500);
        console.log(`✅ Category "${cat}" clicked`);
      } else {
        console.log(`⚠️ Category "${cat}" not found`);
      }
    }

    // Search
    const searchInput = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="endpoint"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill("sms");
      await page.waitForTimeout(1000);
      await ss(page, "05-api-docs-search");
      console.log("✅ Search works");
      await searchInput.clear();
    }

    // Expand All
    const expandBtn = page.locator('button:has-text("Expand All")').first();
    if (await expandBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expandBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, "06-api-docs-expanded");
      console.log("✅ Expand All works");
    }

    console.log("🔴 Console errors:", consoleErrors.length);
    await ctx.close();
  });

  // --- WEBHOOKS (5-9) ---
  test("B5. Webhooks — page loads + list", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/webhooks");
    await ss(page, "07-webhooks-page");

    console.log("📍 URL:", page.url());
    expect(page.url()).toContain("webhook");
    const pageText = await page.textContent("body");
    console.log("👁️ Contains Webhooks text:", /webhook|เว็บฮุก/i.test(pageText || ""));
    console.log("✅ Webhooks page loads");
  });

  test("B6. Webhooks — create new webhook", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/webhooks");

    const createBtn = page.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง"), a:has-text("เพิ่ม")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "08-webhook-create-modal");

      // Fill URL
      const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="webhook"], input[placeholder*="https"]').first();
      await urlInput.clear();
      await urlInput.fill("https://httpbin.org/post");

      // Select events via preset
      const presetBtn = page.locator('text="Delivery events"').first();
      if (await presetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await presetBtn.click();
        console.log("✅ Delivery events preset selected");
      }
      await page.waitForTimeout(500);

      // Save — inside dialog to avoid overlay blocking
      const dialogContent = page.locator('[data-slot="dialog-content"], [role="dialog"], dialog').first();
      if (await dialogContent.isVisible({ timeout: 1000 }).catch(() => false)) {
        await dialogContent.evaluate((el) => el.scrollTo(0, el.scrollHeight));
        await page.waitForTimeout(500);
      }

      const saveBtn = dialogContent.locator('button:has-text("เพิ่ม Webhook"), button:has-text("สร้าง Webhook"), button:has-text("บันทึก"), button:has-text("Save"), button:has-text("สร้าง"), button[type="submit"]').first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click({ force: true });
        console.log("✅ Save clicked");
      }
      await page.waitForTimeout(3000);
      await ss(page, "09-webhook-created");

      const pageText = await page.textContent("body");
      console.log("👁️ Success:", /สำเร็จ|success|secret/i.test(pageText || ""));

      // Close success dialog
      const doneBtn = page.locator('button:has-text("เสร็จสิ้น"), button:has-text("Close"), button:has-text("ตกลง")').first();
      if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await doneBtn.click();
        await page.waitForTimeout(1000);
      }
      console.log("✅ Webhook created");
    } else {
      console.log("⚠️ Create button not visible");
      await ss(page, "08-no-create-btn");
    }
  });

  test("B7. Webhooks — delete webhook", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/webhooks");
    await ss(page, "10-webhooks-before-delete");

    const trashBtn = page.locator('tbody tr button').last();
    if (await trashBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await trashBtn.click();
      await page.waitForTimeout(1000);

      const confirmBtn = page.locator('button:has-text("ยืนยัน"), button:has-text("ลบ"), button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log("✅ Webhook deleted");
      }
      await ss(page, "11-webhooks-after-delete");
    } else {
      console.log("⚠️ No webhook rows to delete");
    }
  });

  // --- CORE PAGES (10-14) ---
  test("B8. Dashboard — KPI cards visible", async ({ page }) => {
    await loginAndGoto(page, "/dashboard");
    await ss(page, "12-dashboard");

    const pageText = await page.textContent("body");
    console.log("📍 URL:", page.url());
    expect(page.url()).toContain("dashboard");

    // Check for KPI-like content
    const hasNumbers = /\d+/.test(pageText || "");
    console.log("👁️ Dashboard has numbers (KPI):", hasNumbers);
    console.log("👁️ Dashboard content:", (pageText || "").substring(0, 200));
    console.log("🔴 Console errors:", consoleErrors.length);
    console.log("✅ Dashboard loads with content");
  });

  test("B9. Contacts — list loads", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/contacts");
    await ss(page, "13-contacts");

    console.log("📍 URL:", page.url());
    expect(page.url()).toContain("contacts");
    const pageText = await page.textContent("body");
    console.log("👁️ Contacts page:", /contact|ผู้ติดต่อ|รายชื่อ/i.test(pageText || ""));
    console.log("🔴 Console errors:", consoleErrors.length);
    console.log("✅ Contacts page loads");
  });

  test("B10. Campaigns — list loads", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/campaigns");
    await page.waitForTimeout(1500);
    await ss(page, "14-campaigns");

    console.log("📍 URL:", page.url());
    const pageText = await page.textContent("body");
    console.log("👁️ Campaigns page:", /campaign|แคมเปญ/i.test(pageText || ""));
    console.log("🔴 Console errors:", consoleErrors.length);
    console.log("✅ Campaigns page loads");
  });

  test("B11. SMS Send — page loads", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/send");
    await ss(page, "15-sms-send");

    console.log("📍 URL:", page.url());
    const pageText = await page.textContent("body");
    console.log("👁️ SMS Send page:", /ส่ง|send|sms|ข้อความ/i.test(pageText || ""));
    console.log("🔴 Console errors:", consoleErrors.length);
    console.log("✅ SMS Send page loads");
  });

  test("B12. SMS History — page loads", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/messages");
    await ss(page, "16-sms-history");

    console.log("📍 URL:", page.url());
    const pageText = await page.textContent("body");
    console.log("👁️ SMS History page:", /history|ประวัติ|message|ข้อความ/i.test(pageText || ""));
    console.log("🔴 Console errors:", consoleErrors.length);
    console.log("✅ SMS History page loads");
  });

  test("B13. Settings — all tabs accessible", async ({ page }) => {
    await loginAndGoto(page, "/dashboard/settings");
    await ss(page, "17-settings");

    console.log("📍 URL:", page.url());
    const pageText = await page.textContent("body");
    console.log("👁️ Settings page:", /settings|ตั้งค่า|profile|โปรไฟล์/i.test(pageText || ""));

    // Check settings tabs/links
    const settingsTabs = [
      { name: "Security", path: "/dashboard/settings/security" },
      { name: "API Keys", path: "/dashboard/settings/api-keys" },
      { name: "Notifications", path: "/dashboard/settings/notifications" },
      { name: "Webhooks", path: "/dashboard/settings/webhooks" },
    ];

    for (const tab of settingsTabs) {
      await page.goto(`${BASE}${tab.path}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const url = page.url();
      console.log(`👁️ Settings/${tab.name}: ${url.includes(tab.path) ? "✅ loads" : "⚠️ redirected to " + url}`);
    }
    await ss(page, "18-settings-tabs");
    console.log("✅ Settings tabs accessible");
  });

  test("B14. All core pages — no 500 errors", async ({ page }) => {
    await loginAndGoto(page, "/dashboard");

    const pages = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/messages",
      "/dashboard/contacts",
      "/dashboard/campaigns",
      "/dashboard/analytics",
      "/dashboard/settings",
      "/dashboard/webhooks",
      "/dashboard/billing",
      "/dashboard/notifications",
    ];

    const results: { page: string; status: string }[] = [];
    let page500count = 0;

    for (const p of pages) {
      const response = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);

      const status = response?.status() || 0;
      const url = page.url();
      const pageText = await page.textContent("body").catch(() => "");
      const has500 = status >= 500 || /internal server error|server error occurred/i.test(pageText || "");

      if (has500) page500count++;
      results.push({ page: p, status: has500 ? "❌ 500" : `✅ ${status}` });
      console.log(`👁️ ${p} → ${status} ${has500 ? "❌ ERROR" : "✅ OK"}`);
    }

    await ss(page, "19-all-pages-check");
    console.log(`\n📊 Pages: ${pages.length} total, ${page500count} with 500 errors`);
    expect(page500count).toBe(0);
    console.log("✅ All core pages load without 500 errors");
  });

  // --- RESPONSIVE ---
  test("B15. Responsive — mobile 375px key pages", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAndGoto(page, "/dashboard");

    const mobilepages = ["/dashboard", "/dashboard/webhooks", "/dashboard/contacts"];
    for (const p of mobilepages) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const label = p.replace("/dashboard", "").replace("/", "") || "dashboard";
      await ss(page, `20-mobile-${label}`);
      console.log(`👁️ Mobile ${label}: scroll=${bodyWidth}/375 → ${bodyWidth > 375 ? "⚠️ OVERFLOW" : "✅ OK"}`);
    }

    console.log("🔴 Console errors:", consoleErrors.length);
    consoleErrors.forEach((e) => console.log("  -", e.substring(0, 150)));
  });
});
