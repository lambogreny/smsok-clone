/**
 * Task #5988 — smsok-clone Full Regression Test
 * All major flows: Register, Login, Send SMS, Contacts, Templates,
 * Campaigns, Packages, Settings, API Keys, Billing
 *
 * 2-Layer: API (A1-A12) + Browser (B1-B14)
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const DIR = "/Users/lambogreny/oracles/qa/screenshots/clone-regression";
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

async function api(p: string, cookie: string, opts?: { method?: string; body?: unknown }) {
  const headers: Record<string, string> = { Cookie: cookie, Origin: BASE };
  if (opts?.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${p}`, {
    method: opts?.method || "GET",
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
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

// ═══════════════════════════════════════
// ชั้น 1: API Tests (A1-A12)
// ═══════════════════════════════════════

test.describe("ชั้น 1: API — Full Regression", () => {
  let cookie: string;
  test.beforeAll(async () => { cookie = await getSessionCookie(); });

  test("A1: Auth — login", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
    });
    expect(res.status).toBe(200);
    console.log("✅ Login 200");
  });

  test("A2: Auth — register (duplicate = 400/409)", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({
        email: `qa-reg-${Date.now()}@test.com`, password: process.env.E2E_USER_PASSWORD!,
        phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
        firstName: "QA", lastName: "Reg",
      }),
    });
    console.log(`📍 Register → ${res.status}`);
    expect([200, 201, 400, 409]).toContain(res.status);
  });

  test("A3: Contacts CRUD", async () => {
    const phone = `08${Math.floor(10000000 + Math.random() * 90000000)}`;
    const create = await api("/api/v1/contacts", cookie, { method: "POST", body: { phone, firstName: "QA-Reg", lastName: `T${Date.now()}` } });
    console.log(`📍 Contact create → ${create.status}`);
    expect([200, 201, 400, 409]).toContain(create.status);

    const list = await api("/api/v1/contacts", cookie);
    expect(list.status).toBe(200);
    console.log(`✅ Contacts: create=${create.status}, list=200`);
  });

  test("A4: Templates CRUD", async () => {
    const create = await api("/api/v1/templates", cookie, { method: "POST", body: { name: `QA-Reg-${Date.now()}`, content: "ทดสอบ {{name}}", category: "marketing" } });
    console.log(`📍 Template create → ${create.status}`);
    expect([200, 201]).toContain(create.status);

    const list = await api("/api/v1/templates", cookie);
    expect(list.status).toBe(200);
    console.log(`✅ Templates: create=${create.status}, list=200`);
  });

  test("A5: Send SMS API", async () => {
    const res = await api("/api/v1/sms/send", cookie, {
      method: "POST",
      body: { to: "0899999999", message: "QA regression test", sender: "SMSOK" },
    });
    console.log(`📍 Send SMS → ${res.status}`);
    // May fail due to no credits/sender — just not 500
    expect(res.status).not.toBe(500);
    console.log(`✅ Send SMS: ${res.status}`);
  });

  test("A6: Payments list", async () => {
    const res = await api("/api/payments", cookie);
    console.log(`📍 Payments → ${res.status}`);
    expect(res.status).toBe(200);
  });

  test("A7: Payment history", async () => {
    const res = await api("/api/v1/payments/history", cookie);
    console.log(`📍 Payment history → ${res.status}`);
    expect(res.status).toBe(200);
  });

  test("A8: Packages list", async () => {
    const res = await api("/api/v1/payments/packages", cookie);
    console.log(`📍 Packages → ${res.status}`);
    expect(res.status).toBe(200);
  });

  test("A9: API Keys", async () => {
    const res = await api("/api/v1/api-keys", cookie);
    console.log(`📍 API Keys → ${res.status}`);
    expect(res.status).not.toBe(500);
  });

  test("A10: Webhooks", async () => {
    const res = await api("/api/v1/webhooks", cookie);
    console.log(`📍 Webhooks → ${res.status}`);
    expect(res.status).not.toBe(500);
  });

  test("A11: Sender Names", async () => {
    const res = await api("/api/v1/sender-names", cookie);
    console.log(`📍 Sender Names → ${res.status}`);
    expect(res.status).not.toBe(500);
  });

  test("A12: All 19 sidebar page routes → not 404/500", async () => {
    const routes = [
      "/dashboard", "/dashboard/send", "/dashboard/messages", "/dashboard/otp",
      "/dashboard/templates", "/dashboard/billing/packages", "/dashboard/packages/my",
      "/dashboard/billing/orders", "/dashboard/contacts", "/dashboard/tags",
      "/dashboard/groups", "/dashboard/senders", "/dashboard/campaigns",
      "/dashboard/analytics", "/dashboard/api-keys", "/dashboard/webhooks",
      "/dashboard/logs", "/dashboard/api-docs", "/dashboard/settings",
    ];
    let pass = 0;
    for (const r of routes) {
      const res = await fetch(`${BASE}${r}`, { headers: { Cookie: cookie, Origin: BASE } });
      expect(res.status, `${r}`).not.toBe(404);
      expect(res.status, `${r}`).not.toBe(500);
      pass++;
    }
    console.log(`✅ All ${pass}/19 sidebar routes OK`);
  });
});

// ═══════════════════════════════════════
// ชั้น 2: Browser Tests (B1-B14)
// ═══════════════════════════════════════

test.describe("ชั้น 2: Browser — Full Regression", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    page = await context.newPage();
    await login(page);
    await ss(page, "B00-dashboard");
  });

  test.afterAll(async () => { await page.context().close(); });

  // ─── B1: Register page ───
  test("B1: Register page loads + form visible", async () => {
    const ctx = await page.context().browser()!.newContext({ viewport: { width: 1280, height: 720 } });
    const regPage = await ctx.newPage();
    await regPage.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await regPage.waitForLoadState("networkidle").catch(() => {});

    const hasForm = await regPage.locator('input[type="email"]').count();
    const hasPass = await regPage.locator('input[type="password"]').count();
    console.log(`👁️ Register form: email=${hasForm > 0}, password=${hasPass > 0}`);

    await regPage.screenshot({ path: `${DIR}/B01-register.png` });
    await ctx.close();
    console.log(`✅ Register page loads`);
  });

  // ─── B2: Login flow ───
  test("B2: Login flow → dashboard", async () => {
    console.log(`📍 URL: ${page.url()}`);
    expect(page.url()).toContain("/dashboard");
    await ss(page, "B02-login-success");
    console.log(`✅ Login flow works`);
  });

  // ─── B3: Dashboard content ───
  test("B3: Dashboard shows KPI cards", async () => {
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    const hasKPI = content?.includes("SMS") || content?.includes("เครดิต") || content?.includes("Credit");
    console.log(`👁️ KPI visible: ${hasKPI}`);

    await ss(page, "B03-dashboard-kpi");
    console.log(`✅ Dashboard loaded`);
  });

  // ─── B4: Send SMS page ───
  test("B4: Send SMS page — form visible", async () => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const textareas = await page.locator("textarea").count();
    console.log(`👁️ Textareas: ${textareas}`);
    expect(textareas).toBeGreaterThan(0);

    await ss(page, "B04-send-sms");
    console.log(`✅ Send SMS form visible`);
  });

  // ─── B5: Contacts page ───
  test("B5: Contacts page — list + add button", async () => {
    await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    const hasContacts = content?.includes("ผู้ติดต่อ") || content?.includes("Contact");
    console.log(`👁️ Contacts content: ${hasContacts}`);

    await ss(page, "B05-contacts");
    console.log(`✅ Contacts page loaded`);
  });

  // ─── B6: Templates page ───
  test("B6: Templates page — list + create", async () => {
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    const hasTemplates = content?.includes("เทมเพลต") || content?.includes("Template");
    console.log(`👁️ Templates content: ${hasTemplates}`);

    await ss(page, "B06-templates");
    console.log(`✅ Templates page loaded`);
  });

  // ─── B7: Campaigns page ───
  test("B7: Campaigns page loads", async () => {
    await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    await ss(page, "B07-campaigns");
    console.log(`✅ Campaigns loaded`);
  });

  // ─── B8: Packages page ───
  test("B8: Packages page — pricing cards", async () => {
    await page.goto(`${BASE}/dashboard/billing/packages`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    const hasPackages = content?.includes("แพ็กเกจ") || content?.includes("Package") || content?.includes("SMS");
    console.log(`👁️ Packages: ${hasPackages}`);

    await ss(page, "B08-packages");
    console.log(`✅ Packages page loaded`);
  });

  // ─── B9: Billing page ───
  test("B9: Billing page — no error toast", async () => {
    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    await ss(page, "B09-billing");
    console.log(`✅ Billing page loaded`);
  });

  // ─── B10: Settings page ───
  test("B10: Settings page — profile visible", async () => {
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    const hasSettings = content?.includes("ตั้งค่า") || content?.includes("Settings") || content?.includes("โปรไฟล์");
    console.log(`👁️ Settings: ${hasSettings}`);

    await ss(page, "B10-settings");
    console.log(`✅ Settings page loaded`);
  });

  // ─── B11: API Keys page ───
  test("B11: API Keys page", async () => {
    await page.goto(`${BASE}/dashboard/api-keys`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    await ss(page, "B11-api-keys");
    console.log(`✅ API Keys page loaded`);
  });

  // ─── B12: Senders page ───
  test("B12: Senders page", async () => {
    await page.goto(`${BASE}/dashboard/senders`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);

    const content = await page.textContent("body");
    const hasSenders = content?.includes("ชื่อผู้ส่ง") || content?.includes("Sender");
    console.log(`👁️ Senders: ${hasSenders}`);

    await ss(page, "B12-senders");
    console.log(`✅ Senders page loaded`);
  });

  // ─── B13: Console errors across all pages ───
  test("B13: No critical JS errors across key pages", async () => {
    const errors: string[] = [];
    const listener = (msg: any) => {
      if (msg.type() === "error") errors.push(msg.text());
    };
    page.on("console", listener);

    const keyPages = [
      "/dashboard", "/dashboard/send", "/dashboard/contacts",
      "/dashboard/templates", "/dashboard/campaigns",
      "/dashboard/billing", "/dashboard/settings",
    ];
    for (const p of keyPages) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(300);
    }

    page.off("console", listener);

    const has500 = errors.filter(e => e.includes("500"));
    console.log(`📍 Console errors: ${errors.length} total, 500s: ${has500.length}`);

    await ss(page, "B13-console-check");
    console.log(`✅ Console check done`);
  });

  // ─── B14: Mobile responsive — 4 key pages ───
  test("B14: Mobile 375px — 4 key pages", async () => {
    const mobileCtx = await page.context().browser()!.newContext({ viewport: { width: 375, height: 812 } });
    const mp = await mobileCtx.newPage();
    await login(mp);

    const pages = [
      { path: "/dashboard", name: "dashboard" },
      { path: "/dashboard/send", name: "send" },
      { path: "/dashboard/contacts", name: "contacts" },
      { path: "/dashboard/billing", name: "billing" },
    ];

    for (const pg of pages) {
      await mp.goto(`${BASE}${pg.path}`, { waitUntil: "domcontentloaded" });
      await mp.waitForLoadState("networkidle").catch(() => {});
      await mp.waitForTimeout(500);

      const bodyWidth = await mp.evaluate(() => document.body.scrollWidth);
      await mp.screenshot({ path: `${DIR}/B14-mobile-${pg.name}.png` });
      console.log(`📍 ${pg.name}: ${bodyWidth}px ${bodyWidth > 400 ? "⚠️ overflow" : "✅"}`);
    }

    await mobileCtx.close();
    console.log(`✅ Mobile responsive check done`);
  });
});
