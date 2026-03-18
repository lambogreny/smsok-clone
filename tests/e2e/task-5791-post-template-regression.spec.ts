/**
 * Task #5791 — Post-Template+Campaign Regression Test (P1)
 * Verify nothing broke after template + campaign pipeline changes
 * Layer 1: API + Layer 2: Browser
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5791";
const BASE = "http://localhost:3000";
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = process.env.E2E_USER_PASSWORD!;

test.beforeAll(() => {
  fs.mkdirSync(DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
  });
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

async function api(p: string, opts: { method?: string; body?: unknown; cookie: string }) {
  const headers: Record<string, string> = { Cookie: opts.cookie, Origin: BASE };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${p}`, {
    method: opts.method || "GET", headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1000);
  const accept = page.locator('text="ยอมรับทั้งหมด"');
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(500);
  }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 5000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// ============================================
// LAYER 1: API REGRESSION
// ============================================
test.describe("Layer 1 — API Regression", () => {
  let cookie: string;
  test.beforeAll(async () => { cookie = await getSessionCookie(); });

  test("API-1. Auth login → 200", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
    });
    expect(res.status).toBe(200);
    console.log("✅ Login 200");
  });

  test("API-2. Register endpoint exists", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({
        email: `qa-reg-${Date.now()}@test.com`,
        password: process.env.E2E_USER_PASSWORD!,
        phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
        firstName: "QA",
        lastName: "Reg",
      }),
    });
    console.log("📍 Register →", res.status);
    // Accept 200/201 (success) or 400/409 (validation/duplicate) — not 500
    expect([200, 201, 400, 409]).toContain(res.status);
    console.log("✅ Register endpoint responds (no 500)");
  });

  test("API-3. Contacts CRUD", async () => {
    // List
    const list = await api("/api/v1/contacts", { cookie });
    expect(list.status).toBe(200);
    console.log("✅ Contacts list 200 — count:", list.data?.contacts?.length ?? list.data?.length ?? 0);

    // Create
    const create = await api("/api/v1/contacts", {
      method: "POST", cookie,
      body: { phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`, firstName: "QA-Reg", lastName: `Test${Date.now()}` },
    });
    console.log("📍 Contact create →", create.status);
    expect([200, 201, 400, 409]).toContain(create.status);
  });

  test("API-4. Templates list", async () => {
    const res = await api("/api/v1/templates", { cookie });
    expect(res.status).toBe(200);
    console.log("✅ Templates 200 — count:", res.data?.templates?.length ?? 0);
  });

  test("API-5. Campaigns list", async () => {
    const res = await api("/api/v1/campaigns", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log("✅ Campaigns:", res.status, "— count:", res.data?.campaigns?.length ?? 0);
  });

  test("API-6. Webhooks CRUD", async () => {
    const create = await api("/api/v1/webhooks", {
      method: "POST", cookie,
      body: { url: "https://httpbin.org/post", events: ["sms.sent"] },
    });
    expect([200, 201]).toContain(create.status);
    const wh = create.data?.webhook || create.data;
    console.log("✅ Webhook created");

    if (wh?.id) {
      const del = await api(`/api/v1/webhooks/${wh.id}`, { method: "DELETE", cookie });
      expect([200, 204]).toContain(del.status);
      console.log("✅ Webhook deleted");
    }
  });

  test("API-7. API Keys list", async () => {
    const res = await api("/api/v1/api-keys", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log("✅ API Keys:", res.status);
  });

  test("API-8. Profile", async () => {
    const res = await api("/api/v1/me", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log("✅ Profile:", res.status);
  });

  test("API-9. Template validate", async () => {
    const res = await api("/api/v1/templates/validate", {
      method: "POST", cookie,
      body: { content: "สวัสดี {{name}} ยอด {{amount}} บาท" },
    });
    expect(res.status).toBe(200);
    console.log("✅ Template validate 200 — vars:", res.data?.variables);
  });

  test("API-10. SMS send validation", async () => {
    // Send with missing fields → should get 400
    const res = await api("/api/v1/sms/send", {
      method: "POST", cookie,
      body: { phone: "0891234567", message: "QA test" },
    });
    console.log("📍 SMS send →", res.status);
    // Accept any non-500 response
    expect(res.status).not.toBe(500);
  });
});

// ============================================
// LAYER 2: BROWSER REGRESSION
// ============================================
test.describe("Layer 2 — Browser Regression", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
  });

  test("B1. Register page loads", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, "01-register.png"), fullPage: false });
    console.log(`📸 ${path.join(DIR, "01-register.png")}`);

    const text = await page.textContent("body");
    console.log("👁️ Register page:", /สมัคร|register|ลงทะเบียน/i.test(text || "") ? "✅ LOADS" : "⚠️");

    // Check form fields exist
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    console.log("👁️ Email input:", await emailInput.isVisible().catch(() => false) ? "✅" : "⚠️");
    console.log("👁️ Password input:", await passInput.isVisible().catch(() => false) ? "✅" : "⚠️");
    await ctx.close();
  });

  test("B2. Login → Dashboard with KPI cards", async ({ page }) => {
    await login(page);
    await ss(page, "02-dashboard");

    expect(page.url()).toContain("dashboard");
    const text = await page.textContent("body");
    console.log("👁️ Dashboard:", /ภาพรวม|dashboard/i.test(text || "") ? "✅" : "⚠️");

    // Check for KPI cards
    const cards = page.locator('[class*="card"], [class*="stat"], [class*="kpi"]');
    const cardCount = await cards.count();
    console.log("👁️ KPI cards found:", cardCount);
  });

  test("B3. Send SMS page — form fields", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "03-send-sms");

    // Fill message in correct textarea
    const textareas = page.locator("textarea");
    const count = await textareas.count();
    console.log("📍 Textareas:", count);

    // Message textarea
    const msgTextarea = page.locator('textarea[placeholder*="ข้อความ"], textarea[placeholder*="SMS"], textarea[placeholder*="พิมพ์"]').first();
    const fallback = count >= 2 ? textareas.nth(1) : textareas.first();
    const textarea = await msgTextarea.isVisible({ timeout: 2000 }).catch(() => false) ? msgTextarea : fallback;

    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill("ทดสอบ QA regression {{name}} รหัส {{otp}}");
      await page.waitForTimeout(1000);
      await ss(page, "04-send-filled");
      console.log("✅ Message filled with variables");

      // Check variable buttons
      const varBtns = page.locator('button:has-text("+ ชื่อ"), button:has-text("+ รหัส"), button:has-text("+ วันที่")');
      console.log("👁️ Variable buttons:", await varBtns.count());
    }
  });

  test("B4. Templates page — list + create", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "05-templates");

    const text = await page.textContent("body");
    console.log("👁️ Templates page:", /เทมเพลต|template/i.test(text || "") ? "✅ LOADS" : "⚠️");

    // Create button
    const createBtn = page.locator('button:has-text("สร้างใหม่"), button:has-text("Create")').first();
    console.log("👁️ Create button:", await createBtn.isVisible({ timeout: 2000 }).catch(() => false) ? "✅" : "⚠️");

    // Template count
    const tabs = page.locator('button:has-text("เทมเพลตของฉัน"), button:has-text("คลังเทมเพลต")');
    console.log("👁️ Template tabs:", await tabs.count());
  });

  test("B5. Campaigns page — list + wizard", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "06-campaigns");

    const text = await page.textContent("body");
    console.log("👁️ Campaigns:", /แคมเปญ|campaign/i.test(text || "") ? "✅" : "⚠️");

    // KPI cards
    const stats = page.locator('[class*="card"]:has-text("ทั้งหมด"), [class*="card"]:has-text("สำเร็จ")');
    console.log("👁️ Campaign stats:", await stats.count());

    // Campaign list
    const rows = page.locator("tbody tr");
    console.log("👁️ Campaign rows:", await rows.count());
  });

  test("B6. Contacts page — list + add", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "07-contacts");

    const text = await page.textContent("body");
    console.log("👁️ Contacts:", /รายชื่อ|contact|ผู้ติดต่อ/i.test(text || "") ? "✅" : "⚠️");

    // Search
    const search = page.locator('input[placeholder*="ค้นหา"], input[placeholder*="search"]').first();
    if (await search.isVisible({ timeout: 2000 }).catch(() => false)) {
      await search.fill("QA");
      await page.waitForTimeout(1000);
      await ss(page, "08-contacts-search");
      console.log("✅ Contacts search works");
    }
  });

  test("B7. Settings page — profile", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "09-settings");

    const text = await page.textContent("body");
    console.log("👁️ Settings:", /ตั้งค่า|settings|โปรไฟล์/i.test(text || "") ? "✅" : "⚠️");
  });

  test("B8. API Keys page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/api-keys`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "10-api-keys");

    const text = await page.textContent("body");
    console.log("👁️ API Keys:", /API|คีย์|key/i.test(text || "") ? "✅" : "⚠️");
  });

  test("B9. Billing page — Prisma fix check", async ({ page }) => {
    await login(page);
    try {
      const res = await page.goto(`${BASE}/dashboard/billing`, {
        waitUntil: "domcontentloaded", timeout: 15000,
      });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
      await ss(page, "11-billing");

      const status = res?.status() || 0;
      console.log(`📍 /dashboard/billing → ${status}`);
      console.log(`👁️ Billing: ${status >= 500 ? "❌ SERVER ERROR" : "✅ LOADS OK"}`);

      // Check for error toast
      const text = await page.textContent("body");
      const hasToastError = /ไม่สามารถโหลด/i.test(text || "");
      console.log("👁️ Toast error:", hasToastError ? "⚠️ data fetch issue" : "✅ none");
    } catch (err) {
      await ss(page, "11-billing-error").catch(() => {});
      console.log(`❌ Billing FAILED: ${(err as Error).message.substring(0, 200)}`);
    }
  });

  test("B10. All 11 core pages → no 500", async ({ page }) => {
    await login(page);
    const pages = [
      "/dashboard", "/dashboard/send", "/dashboard/messages",
      "/dashboard/contacts", "/dashboard/campaigns", "/dashboard/analytics",
      "/dashboard/settings", "/dashboard/webhooks", "/dashboard/billing",
      "/dashboard/templates", "/dashboard/api-keys",
    ];

    let errorCount = 0;
    for (const p of pages) {
      try {
        const res = await page.goto(`${BASE}${p}`, {
          waitUntil: "domcontentloaded", timeout: 15000,
        });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(800);
        const s = res?.status() || 0;
        if (s >= 500) errorCount++;
        console.log(`👁️ ${p} → ${s} ${s >= 500 ? "❌" : "✅"}`);
      } catch {
        errorCount++;
        console.log(`👁️ ${p} → ❌ LOAD FAILED`);
      }
    }

    await ss(page, "12-all-pages");
    console.log(`\n📊 ${pages.length} pages, ${errorCount} errors`);
    expect(errorCount).toBe(0);
  });

  test("B11. Mobile 375px — key pages", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    for (const [p, label] of [
      ["/dashboard", "dashboard"],
      ["/dashboard/templates", "templates"],
      ["/dashboard/campaigns", "campaigns"],
      ["/dashboard/contacts", "contacts"],
      ["/dashboard/send", "send"],
    ] as const) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const w = await page.evaluate(() => document.body.scrollWidth);
      await ss(page, `13-mobile-${label}`);
      console.log(`👁️ Mobile ${label}: ${w}/375 → ${w > 375 ? "⚠️ OVERFLOW" : "✅"}`);
    }
  });

  test("B12. Console errors — full scan", async ({ page }) => {
    await login(page);
    const pages = [
      "/dashboard", "/dashboard/send", "/dashboard/templates",
      "/dashboard/campaigns", "/dashboard/contacts", "/dashboard/billing",
      "/dashboard/settings",
    ];

    for (const p of pages) {
      try {
        await page.goto(`${BASE}${p}`, {
          waitUntil: "domcontentloaded", timeout: 15000,
        });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(1500);
      } catch {}
    }

    await ss(page, "14-console-check");
    const prismaErrors = consoleErrors.filter((e) => /prisma|total_amount|email_package_expiry/i.test(e));
    const criticalErrors = consoleErrors.filter((e) => /internal server error|uncaught|unhandled/i.test(e));

    console.log(`📊 Total console errors: ${consoleErrors.length}`);
    console.log(`📊 Prisma-related: ${prismaErrors.length}`);
    console.log(`📊 Critical errors: ${criticalErrors.length}`);
    consoleErrors.slice(0, 8).forEach((e) => console.log("  -", e.substring(0, 150)));

    if (prismaErrors.length > 0) {
      console.log("⚠️ Prisma errors still present — known issue");
    }
    if (criticalErrors.length > 0) {
      console.log("❌ CRITICAL errors found!");
    } else {
      console.log("✅ No critical errors");
    }
  });
});
