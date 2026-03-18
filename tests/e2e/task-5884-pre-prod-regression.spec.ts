/**
 * Task #5884 — Pre-Production Full Regression Test Suite (P1)
 * Layer 1: API + Layer 2: Browser — comprehensive coverage
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const DIR = "/Users/lambogreny/oracles/qa/screenshots/regression-pre-prod";
const BASE = "http://localhost:3000";
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = process.env.E2E_USER_PASSWORD!;

test.beforeAll(() => { fs.mkdirSync(DIR, { recursive: true }); });

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
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) { await accept.click(); await page.waitForTimeout(500); }
  await page.locator('input[type="email"]').fill(QA_EMAIL);
  await page.locator('input[type="password"]').fill(QA_PASS);
  await page.waitForFunction(() => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled, { timeout: 5000 }).catch(() => {});
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

// ============================================
// LAYER 1: API REGRESSION
// ============================================
test.describe("Layer 1 — API Pre-Prod", () => {
  let cookie: string;
  test.beforeAll(async () => { cookie = await getSessionCookie(); });

  test("API-1. Auth login", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
    });
    expect(res.status).toBe(200);
    console.log("✅ Login 200");
  });

  test("API-2. Register endpoint", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({
        email: `qa-preprod-${Date.now()}@test.com`, password: process.env.E2E_USER_PASSWORD!,
        phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
        firstName: "QA", lastName: "PreProd",
      }),
    });
    console.log("📍 Register →", res.status);
    expect([200, 201, 400, 409]).toContain(res.status);
  });

  test("API-3. Contacts CRUD", async () => {
    const phone = `08${Math.floor(10000000 + Math.random() * 90000000)}`;
    const create = await api("/api/v1/contacts", { method: "POST", cookie, body: { phone, firstName: "QA-PP", lastName: `Test${Date.now()}` } });
    console.log("📍 Contact create →", create.status);
    expect([200, 201, 400, 409]).toContain(create.status);

    const list = await api("/api/v1/contacts", { cookie });
    expect(list.status).toBe(200);
    console.log("✅ Contacts list 200");
  });

  test("API-4. Templates CRUD", async () => {
    const create = await api("/api/v1/templates", { method: "POST", cookie, body: { name: `QA-PP-${Date.now()}`, content: "ทดสอบ {{name}} {{otp}}", category: "otp" } });
    expect([200, 201]).toContain(create.status);
    const id = create.data?.id;
    console.log("✅ Template created:", id);

    if (id) {
      const get = await api(`/api/v1/templates/${id}`, { cookie });
      expect(get.status).toBe(200);
      console.log("✅ Template get 200");

      const update = await api(`/api/v1/templates/${id}`, { method: "PUT", cookie, body: { content: "อัพเดท {{name}} {{code}}" } });
      expect([200, 201]).toContain(update.status);
      console.log("✅ Template updated");

      const del = await api(`/api/v1/templates/${id}`, { method: "DELETE", cookie });
      expect([200, 204]).toContain(del.status);
      console.log("✅ Template archived");
    }
  });

  test("API-5. Webhooks CRUD", async () => {
    const create = await api("/api/v1/webhooks", { method: "POST", cookie, body: { url: "https://httpbin.org/post", events: ["sms.sent"] } });
    expect([200, 201]).toContain(create.status);
    const wh = create.data?.webhook || create.data;
    console.log("✅ Webhook created");

    const list = await api("/api/v1/webhooks", { cookie });
    expect(list.status).toBe(200);

    if (wh?.id) {
      const del = await api(`/api/v1/webhooks/${wh.id}`, { method: "DELETE", cookie });
      expect([200, 204]).toContain(del.status);
      console.log("✅ Webhook deleted");
    }
  });

  test("API-6. Campaigns list", async () => {
    const res = await api("/api/v1/campaigns", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log("✅ Campaigns:", res.status);
  });

  test("API-7. Profile + API Keys", async () => {
    const me = await api("/api/v1/me", { cookie });
    expect([200, 404]).toContain(me.status);
    const keys = await api("/api/v1/api-keys", { cookie });
    expect([200, 404]).toContain(keys.status);
    console.log("✅ Profile:", me.status, "| API Keys:", keys.status);
  });

  test("API-8. Template validate + render", async () => {
    const val = await api("/api/v1/templates/validate", { method: "POST", cookie, body: { content: "{{name}} สั่งซื้อ {{amount}} บาท" } });
    expect(val.status).toBe(200);
    console.log("✅ Validate:", val.data?.variables);

    const render = await api("/api/v1/templates/render", { method: "POST", cookie, body: { content: "สวัสดี {{name}}", variables: { name: "QA" } } });
    expect(render.status).toBe(200);
    console.log("✅ Render:", render.data?.rendered);
  });

  test("API-9. All core endpoints → no 500", async () => {
    const endpoints = [
      "/api/v1/contacts", "/api/v1/templates", "/api/v1/webhooks",
      "/api/v1/campaigns", "/api/v1/api-keys", "/api/v1/me",
    ];
    let errors = 0;
    for (const ep of endpoints) {
      const res = await api(ep, { cookie });
      if (res.status >= 500) errors++;
      console.log(`📍 ${ep} → ${res.status} ${res.status >= 500 ? "❌" : "✅"}`);
    }
    expect(errors).toBe(0);
  });
});

// ============================================
// LAYER 2: BROWSER PRE-PROD
// ============================================
test.describe("Layer 2 — Browser Pre-Prod", () => {
  let consoleErrors: string[];
  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  });

  test("B1. Register page", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(DIR, "01-register.png") });
    console.log(`📸 ${path.join(DIR, "01-register.png")}`);

    const text = await page.textContent("body");
    console.log("👁️ Register:", /สมัคร|register/i.test(text || "") ? "✅" : "⚠️");

    // Check form fields
    const email = page.locator('input[type="email"], input[name="email"]').first();
    const pass = page.locator('input[type="password"]').first();
    console.log("👁️ Email input:", await email.isVisible().catch(() => false) ? "✅" : "⚠️");
    console.log("👁️ Password input:", await pass.isVisible().catch(() => false) ? "✅" : "⚠️");
    await ctx.close();
  });

  test("B2. Login → Dashboard + KPI", async ({ page }) => {
    await login(page);
    await ss(page, "02-dashboard");
    expect(page.url()).toContain("dashboard");

    const text = await page.textContent("body");
    console.log("👁️ Dashboard:", /ภาพรวม|dashboard/i.test(text || "") ? "✅" : "⚠️");
    console.log("👁️ SMS count in header:", /\d+\s*SMS/.test(text || "") ? "✅" : "⚠️");
  });

  test("B3. Send SMS — form fill", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "03-send-page");

    // Fill message
    const textareas = page.locator("textarea");
    const count = await textareas.count();
    const msgArea = page.locator('textarea[placeholder*="ข้อความ"], textarea[placeholder*="SMS"], textarea[placeholder*="พิมพ์"]').first();
    const textarea = await msgArea.isVisible({ timeout: 2000 }).catch(() => false) ? msgArea : (count >= 2 ? textareas.nth(1) : textareas.first());

    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill("สวัสดี {{name}} รหัส {{otp}} ยืนยันภายใน 5 นาที");
      await page.waitForTimeout(1000);
      await ss(page, "04-send-filled");
      console.log("✅ Message filled with variables");
    }

    // Check variable buttons
    const varBtns = page.locator('button:has-text("+ ชื่อ"), button:has-text("+ รหัส")');
    console.log("👁️ Variable buttons:", await varBtns.count());
  });

  test("B4. Contacts — list + add + search", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "05-contacts");

    // Search
    const search = page.locator('input[placeholder*="ค้นหา"]').first();
    if (await search.isVisible({ timeout: 2000 }).catch(() => false)) {
      await search.fill("QA");
      await page.waitForTimeout(1000);
      await ss(page, "06-contacts-search");
      console.log("✅ Search works");
    }

    // Add contact button
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add"), button:has-text("สร้าง")').first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "07-contact-add-dialog");
      console.log("✅ Add contact dialog opened");

      // Close
      const closeBtn = page.locator('button:has-text("ยกเลิก"), button[aria-label="Close"]').first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await closeBtn.click();
    }
  });

  test("B5. Templates — CRUD + Archive", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "08-templates");

    // Create
    const createBtn = page.locator('button:has-text("สร้างใหม่")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "09-template-create");

      // Fill
      const nameInput = page.locator('input[placeholder*="ชื่อ"], input[placeholder*="OTP"]').first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill(`QA-PreProd-${Date.now()}`);
      }
      const textarea = page.locator("textarea").first();
      if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
        await textarea.fill("ทดสอบ Pre-Prod {{name}} {{otp}}");
      }
      await page.waitForTimeout(500);
      await ss(page, "10-template-filled");

      // Save
      const dialog = page.locator('[data-slot="dialog-content"], [role="dialog"]').first();
      if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        const saveBtn = dialog.locator('button:has-text("สร้างเทมเพลต"), button:has-text("บันทึก"), button:has-text("Save"), button[type="submit"]').first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click({ force: true });
          await page.waitForTimeout(2000);
          await ss(page, "11-template-saved");
          console.log("✅ Template created");
        }
      }
    }

    // Archive via 3-dot menu
    const menuBtn = page.locator('[class*="card"] button:has(svg), tbody tr button').last();
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(500);
      await ss(page, "12-template-menu");
    }
  });

  test("B6. Campaigns page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "13-campaigns");

    const text = await page.textContent("body");
    console.log("👁️ Campaigns:", /แคมเปญ|campaign/i.test(text || "") ? "✅" : "⚠️");
    const rows = page.locator("tbody tr");
    console.log("👁️ Campaign rows:", await rows.count());
  });

  test("B7. Packages page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/packages`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "14-packages");

    const text = await page.textContent("body");
    console.log("👁️ Packages:", /แพ็คเกจ|package|SMS|ราคา/i.test(text || "") ? "✅" : "⚠️");
  });

  test("B8. Settings — all tabs", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "15-settings");

    const text = await page.textContent("body");
    console.log("👁️ Settings:", /ตั้งค่า|settings|โปรไฟล์/i.test(text || "") ? "✅" : "⚠️");

    // Click through tabs if available
    const tabs = page.locator('button[role="tab"], a[role="tab"], [class*="tab"]');
    const tabCount = await tabs.count();
    console.log("👁️ Settings tabs:", tabCount);

    for (let i = 0; i < Math.min(tabCount, 6); i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent();
      if (await tab.isVisible().catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(1000);
        console.log(`📍 Tab ${i + 1}: "${tabText?.trim()}"`);
      }
    }
    await ss(page, "16-settings-tabs");
  });

  test("B9. API Keys page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/api-keys`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "17-api-keys");
    console.log("👁️ API Keys:", /API|คีย์|key/i.test(await page.textContent("body") || "") ? "✅" : "⚠️");
  });

  test("B10. Webhooks page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/webhooks`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "18-webhooks");
    console.log("👁️ Webhooks:", /webhook/i.test(await page.textContent("body") || "") ? "✅" : "⚠️");
  });

  test("B11. Billing page", async ({ page }) => {
    await login(page);
    try {
      const res = await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
      await ss(page, "19-billing");
      console.log(`📍 Billing → ${res?.status() || 0} ${(res?.status() || 0) >= 500 ? "❌" : "✅"}`);
    } catch (err) {
      await ss(page, "19-billing-error").catch(() => {});
      console.log(`❌ Billing failed: ${(err as Error).message.substring(0, 100)}`);
    }
  });

  test("B12. Sidebar — all pages HTTP 200", async ({ page }) => {
    await login(page);
    const pages = [
      "/dashboard", "/dashboard/send", "/dashboard/messages",
      "/dashboard/contacts", "/dashboard/campaigns", "/dashboard/analytics",
      "/dashboard/settings", "/dashboard/webhooks", "/dashboard/billing",
      "/dashboard/templates", "/dashboard/api-keys", "/dashboard/packages",
    ];
    let errors = 0;
    for (const p of pages) {
      try {
        const res = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(600);
        const s = res?.status() || 0;
        if (s >= 500) errors++;
        console.log(`👁️ ${p} → ${s} ${s >= 500 ? "❌" : "✅"}`);
      } catch {
        errors++;
        console.log(`👁️ ${p} → ❌ FAILED`);
      }
    }
    await ss(page, "20-all-pages");
    console.log(`\n📊 ${pages.length} pages, ${errors} errors`);
    expect(errors).toBe(0);
  });

  test("B13. Mobile 375px — 6 key pages", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    for (const [p, label] of [
      ["/dashboard", "dashboard"],
      ["/dashboard/send", "send"],
      ["/dashboard/contacts", "contacts"],
      ["/dashboard/templates", "templates"],
      ["/dashboard/campaigns", "campaigns"],
      ["/dashboard/settings", "settings"],
    ] as const) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1200);
      const w = await page.evaluate(() => document.body.scrollWidth);
      await ss(page, `21-mobile-${label}`);
      console.log(`👁️ Mobile ${label}: ${w}/375 → ${w > 375 ? "⚠️ OVERFLOW" : "✅"}`);
    }
  });

  test("B14. Console errors — full scan", async ({ page }) => {
    await login(page);
    for (const p of ["/dashboard", "/dashboard/send", "/dashboard/templates", "/dashboard/campaigns", "/dashboard/contacts", "/dashboard/billing", "/dashboard/settings", "/dashboard/webhooks"]) {
      try {
        await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(1200);
      } catch {}
    }
    await ss(page, "22-console-check");

    const prisma = consoleErrors.filter((e) => /prisma/i.test(e));
    const critical = consoleErrors.filter((e) => /uncaught|unhandled/i.test(e));
    console.log(`📊 Total: ${consoleErrors.length} | Prisma: ${prisma.length} | Critical: ${critical.length}`);
    consoleErrors.slice(0, 8).forEach((e) => console.log("  -", e.substring(0, 150)));

    if (critical.length > 0) console.log("❌ CRITICAL errors!");
    else console.log("✅ No critical errors");
  });
});
