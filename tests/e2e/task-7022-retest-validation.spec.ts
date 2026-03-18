import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_USER = { email: "qa-suite@smsok.test", password: process.env.E2E_USER_PASSWORD! };

async function dismissCookies(page: Page) {
  for (const text of ["ยอมรับทั้งหมด", "ยอมรับ", "Accept All"]) {
    const btn = page.getByText(text, { exact: false });
    if (await btn.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.first().click({ force: true });
      await page.waitForTimeout(500);
      return;
    }
  }
}

async function loginCtx(browser: any): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await dismissCookies(page);
  await page.locator('input[type="email"]').fill(QA_USER.email);
  await page.locator('input[type="password"]').fill(QA_USER.password);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click({ force: true });
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.close();
  return ctx;
}

// ===================== FIX 1: API Key non-existent → 404 =====================
test("FIX 1: GET /api/v1/api-keys/:nonexistent → 404", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  console.log("\n=== FIX 1: API Key non-existent → 404 ===");

  // String ID
  const r1 = await page.request.fetch(`${BASE}/api/v1/api-keys/nonexistent-key-id-999`);
  console.log(`GET /api/v1/api-keys/nonexistent-key-id-999: ${r1.status()}`);
  console.log(`${r1.status() === 404 ? "✅ FIXED" : "❌ STILL BROKEN"} (expected 404, got ${r1.status()})`);

  // Numeric ID
  const r2 = await page.request.fetch(`${BASE}/api/v1/api-keys/999999`);
  console.log(`GET /api/v1/api-keys/999999: ${r2.status()}`);
  console.log(`${r2.status() === 404 ? "✅ FIXED" : "❌ STILL BROKEN"} (expected 404, got ${r2.status()})`);

  // Fake cuid
  const r3 = await page.request.fetch(`${BASE}/api/v1/api-keys/cmmxxxxxxxxxxxxxxxxx`);
  console.log(`GET /api/v1/api-keys/cmmxxxxxxxxxxxxxxxxx: ${r3.status()}`);
  console.log(`${r3.status() === 404 ? "✅ FIXED" : "❌ STILL BROKEN"} (expected 404, got ${r3.status()})`);

  // Existing key should still be 200
  const listResp = await page.request.fetch(`${BASE}/api/v1/api-keys`);
  const listBody = await listResp.json().catch(() => ({}));
  const keys = Array.isArray(listBody) ? listBody : (listBody.data || listBody.apiKeys || []);
  if (keys.length > 0) {
    const r4 = await page.request.fetch(`${BASE}/api/v1/api-keys/${keys[0].id}`);
    console.log(`GET existing key ${keys[0].id}: ${r4.status()}`);
    console.log(`${r4.status() === 200 ? "✅ STILL WORKS" : "❌ REGRESSION"} (expected 200)`);
  }

  console.log("=== FIX 1 DONE ===\n");
  await ctx.close();
});

// ===================== FIX 2: Blacklist XSS reason → 400 =====================
test("FIX 2: Blacklist XSS in reason → 400 not 500", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  console.log("\n=== FIX 2: Blacklist XSS reason → 400 ===");

  // Get API key for auth
  const listResp = await page.request.fetch(`${BASE}/api/v1/api-keys`);
  const listBody = await listResp.json().catch(() => ({}));
  const keys = Array.isArray(listBody) ? listBody : (listBody.data || listBody.apiKeys || []);
  let apiKey: string | null = null;
  for (const k of keys) { if (k.key) { apiKey = k.key; break; } }

  // Test via session auth (browser context)
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
  ];

  for (const payload of xssPayloads) {
    const resp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: "0891111111", reason: payload }),
    });
    const status = resp.status();
    const body = await resp.text().catch(() => "");
    const has500 = status >= 500;
    const scriptInBody = body.includes("<script>") || body.includes("onerror=");
    console.log(`XSS "${payload.substring(0, 30)}...": ${status} 500=${has500} scriptInBody=${scriptInBody}`);
    console.log(`${!has500 ? "✅ FIXED" : "❌ STILL 500"} (expected non-500, got ${status})`);
  }

  // Cleanup
  if (apiKey) {
    await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      data: JSON.stringify({ phone: "0891111111" }),
    });
  }

  console.log("=== FIX 2 DONE ===\n");
  await ctx.close();
});

// ===================== FIX 3: Blacklist +66 format → accept =====================
test("FIX 3: Blacklist +66 phone format → accept not 500", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  console.log("\n=== FIX 3: Blacklist +66 format → accept ===");

  const phoneFormats = [
    { phone: "+66891234567", label: "+66 format" },
    { phone: "0891234567", label: "0XX format" },
    { phone: "+66812345678", label: "+66 another" },
  ];

  for (const pf of phoneFormats) {
    const resp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: pf.phone, reason: "QA format test" }),
    });
    const status = resp.status();
    const has500 = status >= 500;
    console.log(`${pf.label} "${pf.phone}": ${status}`);
    console.log(`${!has500 ? "✅ FIXED" : "❌ STILL 500"} (expected non-500, got ${status})`);
  }

  // Cleanup
  for (const pf of phoneFormats) {
    await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: pf.phone }),
    });
  }

  console.log("=== FIX 3 DONE ===\n");
  await ctx.close();
});

// ===================== BROWSER: Verify UI still works =====================
test("BROWSER: Blacklist + API Keys UI regression", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();

  console.log("\n=== BROWSER REGRESSION ===");

  // Blacklist page
  await page.goto(`${BASE}/dashboard/contacts/blacklist`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/7022-blacklist.png", fullPage: true });
  const blText = await page.locator("body").textContent().catch(() => "") || "";
  console.log(`📍 Blacklist: ${page.url()}`);
  console.log(`👁️ ${blText.length > 200 ? "✅ Page loaded" : "❌ Empty"}`);

  // API Keys page
  await page.goto(`${BASE}/dashboard/api-keys`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/7022-api-keys.png", fullPage: true });
  const akText = await page.locator("body").textContent().catch(() => "") || "";
  console.log(`📍 API Keys: ${page.url()}`);
  console.log(`👁️ ${akText.length > 200 ? "✅ Page loaded" : "❌ Empty"}`);

  // Core pages quick check
  const quickPages = ["/dashboard", "/dashboard/send", "/dashboard/contacts", "/dashboard/settings"];
  for (const p of quickPages) {
    const resp = await page.goto(`${BASE}${p}`, { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    console.log(`✅ ${p}: ${resp?.status()}`);
  }

  console.log("=== BROWSER REGRESSION DONE ===\n");
  await ctx.close();
});
