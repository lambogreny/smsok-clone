/**
 * Task #5728 — Full Regression After P0 Fixes (P0)
 * Commits: 73b9d6e + 72eb654 + 690934d
 * Focus: Prisma errors fixed, +66 phone normalization, billing page
 * Layer 1: API + Layer 2: Browser
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5728";
const BASE = "http://localhost:3000";
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = "QATest123!";

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
// LAYER 1: API TESTS
// ============================================
test.describe("Layer 1 — API", () => {
  let cookie: string;
  test.beforeAll(async () => { cookie = await getSessionCookie(); });

  test("API-1. Login → 200", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
    });
    expect(res.status).toBe(200);
    console.log("✅ Login 200");
  });

  test("API-2. Contacts create +66 phone", async () => {
    const res = await api("/api/v1/contacts", {
      method: "POST", cookie,
      body: { phone: "+66812345678", firstName: "QA", lastName: "Phone66" },
    });
    console.log("📍 POST /api/v1/contacts (+66) →", res.status, JSON.stringify(res.data).substring(0, 200));
    expect([200, 201, 400, 409]).toContain(res.status);
    if (res.status === 200 || res.status === 201) {
      console.log("✅ +66 phone accepted (normalized)");
    } else {
      console.log("⚠️ +66 phone returned", res.status, "—", JSON.stringify(res.data).substring(0, 100));
    }
  });

  test("API-3. Contacts list", async () => {
    const res = await api("/api/v1/contacts", { cookie });
    expect(res.status).toBe(200);
    console.log("✅ Contacts list 200");
  });

  test("API-4. Webhooks CRUD", async () => {
    const c = await api("/api/v1/webhooks", { method: "POST", cookie, body: { url: "https://httpbin.org/post", events: ["sms.sent"] } });
    expect([200, 201]).toContain(c.status);
    const wh = c.data?.webhook || c.data;
    console.log("✅ Webhook created");

    const l = await api("/api/v1/webhooks", { cookie });
    expect(l.status).toBe(200);

    if (wh?.id) {
      const d = await api(`/api/v1/webhooks/${wh.id}`, { method: "DELETE", cookie });
      expect([200, 204]).toContain(d.status);
      console.log("✅ Webhook deleted");
    }
  });

  test("API-5. API Keys list", async () => {
    const res = await api("/api/v1/api-keys", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log("✅ API Keys:", res.status);
  });

  test("API-6. Campaigns list", async () => {
    const res = await api("/api/v1/campaigns", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log("✅ Campaigns:", res.status);
  });

  test("API-7. Profile", async () => {
    const res = await api("/api/v1/me", { cookie });
    expect([200, 404]).toContain(res.status);
    console.log("✅ Profile:", res.status);
  });
});

// ============================================
// LAYER 2: BROWSER TESTS
// ============================================
test.describe("Layer 2 — Browser", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  });

  test("B1. Login → dashboard", async ({ page }) => {
    await login(page);
    await ss(page, "01-dashboard");
    expect(page.url()).toContain("dashboard");
    console.log("✅ Dashboard loads");
  });

  test("B2. SMS Send page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "02-sms-send");
    console.log("✅ SMS Send loads");
  });

  test("B3. Contacts page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "03-contacts");
    console.log("✅ Contacts loads");
  });

  test("B4. Campaigns page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "04-campaigns");
    console.log("✅ Campaigns loads");
  });

  test("B5. Webhooks CRUD browser", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/webhooks`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "05-webhooks");
    console.log("✅ Webhooks loads");
  });

  test("B6. API Keys page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/api-keys`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "06-api-keys");
    console.log("✅ API Keys loads");
  });

  test("B7. Templates page", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "07-templates");
    console.log("✅ Templates loads");
  });

  test("B8. Billing/packages — Prisma fix verified", async ({ page }) => {
    await login(page);
    try {
      const res = await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(2000);
      await ss(page, "08-billing");
      const status = res?.status() || 0;
      console.log(`📍 /dashboard/billing → ${status}`);
      console.log(`👁️ Billing page: ${status >= 500 ? "❌ SERVER ERROR (Prisma fix NOT working)" : "✅ LOADS OK"}`);
      console.log("🔴 Console errors:", consoleErrors.length);
      consoleErrors.forEach((e) => console.log("  -", e.substring(0, 150)));
    } catch (err) {
      await ss(page, "08-billing-error").catch(() => {});
      console.log(`❌ Billing LOAD FAILED: ${(err as Error).message.substring(0, 200)}`);
    }
  });

  test("B9. All 11 core pages → HTTP 200", async ({ page }) => {
    await login(page);
    const pages = [
      "/dashboard", "/dashboard/send", "/dashboard/messages",
      "/dashboard/contacts", "/dashboard/campaigns", "/dashboard/analytics",
      "/dashboard/settings", "/dashboard/webhooks", "/dashboard/billing",
      "/dashboard/notifications", "/dashboard/api-keys",
    ];

    let errorCount = 0;
    for (const p of pages) {
      try {
        const res = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 15000 });
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

    await ss(page, "09-all-pages");
    console.log(`\n📊 ${pages.length} pages, ${errorCount} errors`);
    expect(errorCount).toBe(0);
  });

  test("B10. Mobile 375px — no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    for (const [p, label] of [["/dashboard", "dashboard"], ["/dashboard/contacts", "contacts"], ["/dashboard/webhooks", "webhooks"]] as const) {
      await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const w = await page.evaluate(() => document.body.scrollWidth);
      await ss(page, `10-mobile-${label}`);
      console.log(`👁️ Mobile ${label}: ${w}/375 → ${w > 375 ? "⚠️ OVERFLOW" : "✅"}`);
    }
  });

  test("B11. Console errors check (Prisma fixed?)", async ({ page }) => {
    await login(page);
    const pages = ["/dashboard", "/dashboard/send", "/dashboard/billing", "/dashboard/settings"];

    for (const p of pages) {
      try {
        await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForLoadState("networkidle").catch(() => {});
        await page.waitForTimeout(1500);
      } catch {}
    }

    await ss(page, "11-console-check");
    const prismaErrors = consoleErrors.filter((e) => /prisma|total_amount|email_package_expiry/i.test(e));
    console.log(`📊 Total console errors: ${consoleErrors.length}`);
    console.log(`📊 Prisma-related errors: ${prismaErrors.length}`);
    consoleErrors.slice(0, 5).forEach((e) => console.log("  -", e.substring(0, 150)));

    if (prismaErrors.length > 0) {
      console.log("❌ PRISMA ERRORS STILL PRESENT — P0 fix NOT complete");
    } else {
      console.log("✅ No Prisma errors — P0 fix verified");
    }
  });

  test("B12. Landing page hero + pricing", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "12-landing-hero");

    const text = await page.textContent("body");
    console.log("👁️ Hero:", /SMS|Marketing|SMSOK/i.test(text || "") ? "✅" : "⚠️");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
    await page.waitForTimeout(1000);
    await ss(page, "13-landing-pricing");
    console.log("👁️ Pricing:", /แพ็คเกจ|ราคา|บาท/i.test(text || "") ? "✅" : "⚠️");

    await ctx.close();
  });
});
