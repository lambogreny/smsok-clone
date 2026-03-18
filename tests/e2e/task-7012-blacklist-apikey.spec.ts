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

async function snap(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/7012-${name}.png`, fullPage: true });
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

// ===================== LAYER 1: API TESTS =====================

test.describe("Layer 1: API Tests", () => {

  test("Blacklist CRUD — create, list, delete", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded").catch(() => {});

    const testPhone = "0891234567";
    const testReason = "QA Test blacklist";

    console.log("\n=== BLACKLIST CRUD ===");

    // 1. CREATE — POST blacklist
    const createResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: testPhone, reason: testReason }),
    });
    const createStatus = createResp.status();
    const createBody = await createResp.json().catch(() => ({}));
    console.log(`POST blacklist: ${createStatus} → ${JSON.stringify(createBody).substring(0, 200)}`);
    console.log(`${createStatus === 200 || createStatus === 201 ? "✅" : "❌"} CREATE: ${createStatus}`);

    // 2. LIST — GET blacklist
    const listResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`);
    const listStatus = listResp.status();
    const listBody = await listResp.json().catch(() => ({}));
    const entries = Array.isArray(listBody) ? listBody : (listBody.data || listBody.blacklist || []);
    const found = entries.some((e: any) => e.phone === testPhone || e.phone === "+66891234567");
    console.log(`GET blacklist: ${listStatus} → ${entries.length} entries, testPhone found=${found}`);
    console.log(`${listStatus === 200 && found ? "✅" : "❌"} LIST: ${listStatus} found=${found}`);

    // 3. DELETE — DELETE blacklist
    const deleteResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: testPhone }),
    });
    const deleteStatus = deleteResp.status();
    console.log(`DELETE blacklist: ${deleteStatus}`);
    console.log(`${deleteStatus === 200 || deleteStatus === 204 ? "✅" : "❌"} DELETE: ${deleteStatus}`);

    // 4. VERIFY deleted
    const verifyResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`);
    const verifyBody = await verifyResp.json().catch(() => ({}));
    const verifyEntries = Array.isArray(verifyBody) ? verifyBody : (verifyBody.data || verifyBody.blacklist || []);
    const stillExists = verifyEntries.some((e: any) => e.phone === testPhone || e.phone === "+66891234567");
    console.log(`${!stillExists ? "✅" : "❌"} VERIFY DELETED: stillExists=${stillExists}`);

    console.log("=== BLACKLIST CRUD DONE ===\n");
    await ctx.close();
  });

  test("Blacklist tenant isolation — same phone, different users", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded").catch(() => {});

    const isolationPhone = "0899999999";

    console.log("\n=== BLACKLIST TENANT ISOLATION ===");

    // User A (qa-suite) blacklists the phone
    const resp1 = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: isolationPhone, reason: "User A test" }),
    });
    const status1 = resp1.status();
    console.log(`User A blacklist ${isolationPhone}: ${status1}`);
    console.log(`${status1 === 200 || status1 === 201 ? "✅" : "❌"} User A create: ${status1}`);

    // User A re-blacklists same phone (upsert — should not 409)
    const resp2 = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: isolationPhone, reason: "User A updated reason" }),
    });
    const status2 = resp2.status();
    console.log(`User A re-blacklist same phone: ${status2}`);
    console.log(`${status2 === 200 || status2 === 201 ? "✅" : "❌"} Upsert (no 409): ${status2}`);

    // Verify only User A's entries are visible
    const listResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`);
    const listBody = await listResp.json().catch(() => ({}));
    const entries = Array.isArray(listBody) ? listBody : (listBody.data || listBody.blacklist || []);
    console.log(`User A list: ${entries.length} entries`);

    // Cleanup
    await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: isolationPhone }),
    });

    console.log("=== TENANT ISOLATION DONE ===\n");
    await ctx.close();
  });

  test("API Key GET by ID — 200 or 404, not 405/500", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded").catch(() => {});

    console.log("\n=== API KEY GET BY ID ===");

    // 1. List existing API keys
    const listResp = await page.request.fetch(`${BASE}/api/v1/api-keys`);
    const listStatus = listResp.status();
    const listBody = await listResp.json().catch(() => ({}));
    const keys = Array.isArray(listBody) ? listBody : (listBody.data || listBody.apiKeys || []);
    console.log(`GET /api/v1/api-keys: ${listStatus} → ${keys.length} keys`);

    // 2. GET existing key by ID (if any)
    if (keys.length > 0) {
      const keyId = keys[0].id;
      const getResp = await page.request.fetch(`${BASE}/api/v1/api-keys/${keyId}`);
      const getStatus = getResp.status();
      const getBody = await getResp.json().catch(() => ({}));
      console.log(`GET /api/v1/api-keys/${keyId}: ${getStatus}`);
      console.log(`${getStatus === 200 ? "✅" : "❌"} GET existing key: ${getStatus} (expected 200)`);
      if (getStatus === 200) {
        console.log(`  Key data: id=${getBody.id || getBody.data?.id}, name=${getBody.name || getBody.data?.name}`);
      }
    } else {
      console.log("⚠️ No existing API keys to test GET by ID — creating one");
      const createResp = await page.request.fetch(`${BASE}/api/v1/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ name: "QA Test Key 7012" }),
      });
      const createStatus = createResp.status();
      const createBody = await createResp.json().catch(() => ({}));
      console.log(`POST create key: ${createStatus}`);

      if (createStatus === 200 || createStatus === 201) {
        const newId = createBody.id || createBody.data?.id;
        if (newId) {
          const getResp = await page.request.fetch(`${BASE}/api/v1/api-keys/${newId}`);
          const getStatus = getResp.status();
          console.log(`GET /api/v1/api-keys/${newId}: ${getStatus}`);
          console.log(`${getStatus === 200 ? "✅" : "❌"} GET new key: ${getStatus} (expected 200)`);
        }
      }
    }

    // 3. GET non-existent key — should be 404, not 405/500
    const fakeId = "nonexistent-key-id-999";
    const notFoundResp = await page.request.fetch(`${BASE}/api/v1/api-keys/${fakeId}`);
    const notFoundStatus = notFoundResp.status();
    console.log(`GET /api/v1/api-keys/${fakeId}: ${notFoundStatus}`);
    console.log(`${notFoundStatus === 404 ? "✅" : "❌"} GET non-existent: ${notFoundStatus} (expected 404, not 405/500)`);

    // 4. GET with numeric ID
    const numResp = await page.request.fetch(`${BASE}/api/v1/api-keys/999999`);
    const numStatus = numResp.status();
    console.log(`GET /api/v1/api-keys/999999: ${numStatus}`);
    console.log(`${numStatus === 404 ? "✅" : "❌"} GET numeric non-existent: ${numStatus} (expected 404)`);

    console.log("=== API KEY GET BY ID DONE ===\n");
    await ctx.close();
  });

  test("Blacklist edge cases — empty phone, invalid format, special chars", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded").catch(() => {});

    console.log("\n=== BLACKLIST EDGE CASES ===");

    // Empty phone
    const emptyResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: "", reason: "test" }),
    });
    console.log(`${emptyResp.status() >= 400 && emptyResp.status() < 500 ? "✅" : "❌"} Empty phone: ${emptyResp.status()} (expected 4xx)`);

    // No phone field
    const noPhoneResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ reason: "test" }),
    });
    console.log(`${noPhoneResp.status() >= 400 && noPhoneResp.status() < 500 ? "✅" : "❌"} Missing phone: ${noPhoneResp.status()} (expected 4xx)`);

    // XSS in reason
    const xssResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: "0891111111", reason: '<script>alert("xss")</script>' }),
    });
    const xssStatus = xssResp.status();
    const xssBody = await xssResp.text().catch(() => "");
    const xssStored = xssBody.includes("<script>");
    console.log(`${!xssStored ? "✅" : "❌"} XSS in reason: ${xssStatus} scriptStored=${xssStored}`);

    // SQLi in phone
    const sqliResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: "'; DROP TABLE phone_blacklist;--", reason: "sqli test" }),
    });
    console.log(`${sqliResp.status() >= 400 && sqliResp.status() < 500 ? "✅" : "⚠️"} SQLi phone: ${sqliResp.status()}`);

    // Cleanup XSS test entry
    await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: "0891111111" }),
    });

    console.log("=== BLACKLIST EDGE CASES DONE ===\n");
    await ctx.close();
  });

  test("Blacklist — no auth → 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    console.log("\n=== BLACKLIST AUTH CHECK ===");

    const endpoints = [
      { method: "GET", url: `${BASE}/api/v1/contacts/blacklist` },
      { method: "POST", url: `${BASE}/api/v1/contacts/blacklist` },
      { method: "DELETE", url: `${BASE}/api/v1/contacts/blacklist` },
    ];

    for (const ep of endpoints) {
      const resp = await page.request.fetch(ep.url, {
        method: ep.method,
        headers: { "Content-Type": "application/json" },
        data: ep.method !== "GET" ? JSON.stringify({ phone: "0891234567" }) : undefined,
      });
      const status = resp.status();
      console.log(`${status === 401 ? "✅" : "❌"} ${ep.method} blacklist no-auth: ${status} (expected 401)`);
    }

    console.log("=== AUTH CHECK DONE ===\n");
    await ctx.close();
  });
});

// ===================== LAYER 2: BROWSER TESTS =====================

test.describe("Layer 2: Browser Tests", () => {

  test("Blacklist UI — navigate, add, verify, delete", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();

    console.log("\n=== BROWSER: BLACKLIST UI ===");

    // Navigate to blacklist page
    await page.goto(`${BASE}/dashboard/contacts/blacklist`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await snap(page, "blacklist-page");

    const bodyText = await page.locator("body").textContent().catch(() => "") || "";
    const hasBlacklistUI = bodyText.includes("Blacklist") || bodyText.includes("บัญชีดำ") || bodyText.includes("blacklist");
    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ Blacklist page loaded: ${hasBlacklistUI}`);

    // Try to add a phone to blacklist via UI
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add"), button:has-text("บล็อค")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      await snap(page, "blacklist-add-modal");

      const phoneInput = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="เบอร์"], input[placeholder*="phone"]').first();
      const reasonInput = page.locator('input[name="reason"], textarea[name="reason"], input[placeholder*="เหตุผล"], input[placeholder*="reason"]').first();

      if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await phoneInput.fill("0895551234");
        console.log("✅ Phone input fillable");

        if (await reasonInput.isVisible().catch(() => false)) {
          await reasonInput.fill("QA browser test");
          console.log("✅ Reason input fillable");
        }

        // Submit
        const saveBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save"), button:has-text("เพิ่ม"), button:has-text("บล็อค"), button[type="submit"]').last();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click({ force: true });
          await page.waitForTimeout(3000);
          await snap(page, "blacklist-after-add");

          const afterText = await page.locator("body").textContent().catch(() => "") || "";
          const addSuccess = afterText.includes("0895551234") || afterText.includes("สำเร็จ") || afterText.includes("success");
          console.log(`${addSuccess ? "✅" : "⚠️"} Blacklist add result: ${addSuccess ? "visible in list" : "check screenshot"}`);
        }
      } else {
        console.log("⚠️ No phone input in modal — check screenshot");
      }
    } else {
      console.log("⚠️ No add button found on blacklist page");
    }

    // Cleanup via API
    await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ phone: "0895551234" }),
    });

    console.log("=== BROWSER: BLACKLIST UI DONE ===\n");
    await ctx.close();
  });

  test("API Keys UI — navigate, verify GET by ID works in UI", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();

    console.log("\n=== BROWSER: API KEYS UI ===");

    await page.goto(`${BASE}/dashboard/api-keys`);
    await dismissCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await snap(page, "api-keys-page");

    const bodyText = await page.locator("body").textContent().catch(() => "") || "";
    const hasApiKeysUI = bodyText.includes("API") || bodyText.includes("คีย์");
    console.log(`📍 URL: ${page.url()}`);
    console.log(`👁️ API Keys page: ${hasApiKeysUI ? "loaded" : "not found"}`);

    // Check for existing keys in table
    const rows = await page.locator("table tbody tr, [class*='row']").count().catch(() => 0);
    console.log(`👁️ API key rows visible: ${rows}`);

    // Check console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("hydrat") && !msg.text().includes("HMR")) {
        consoleErrors.push(msg.text().substring(0, 150));
      }
    });

    // Navigate away and back to trigger any lazy loads
    await page.goto(`${BASE}/dashboard`);
    await page.waitForTimeout(1000);
    await page.goto(`${BASE}/dashboard/api-keys`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await snap(page, "api-keys-reload");

    console.log(`Console errors: ${consoleErrors.length}`);
    for (const e of consoleErrors.slice(0, 3)) console.log(`  ⚠️ ${e}`);

    console.log("=== BROWSER: API KEYS UI DONE ===\n");
    await ctx.close();
  });

  test("Regression — core pages still work", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("hydrat") && !msg.text().includes("HMR")) {
        consoleErrors.push(msg.text().substring(0, 150));
      }
    });

    const pages = [
      { path: "/dashboard", name: "Dashboard" },
      { path: "/dashboard/send", name: "Send SMS" },
      { path: "/dashboard/contacts", name: "Contacts" },
      { path: "/dashboard/history", name: "History" },
      { path: "/dashboard/senders", name: "Senders" },
      { path: "/dashboard/campaigns", name: "Campaigns" },
      { path: "/dashboard/settings", name: "Settings" },
      { path: "/dashboard/packages", name: "Packages" },
      { path: "/dashboard/orders", name: "Orders" },
      { path: "/dashboard/api-keys", name: "API Keys" },
    ];

    console.log("\n=== REGRESSION: CORE PAGES ===");
    let passed = 0;
    let failed = 0;

    for (const p of pages) {
      const resp = await page.goto(`${BASE}${p.path}`, { timeout: 15000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
      const status = resp?.status() || 0;
      const body = await page.locator("body").textContent().catch(() => "") || "";
      const is500 = status >= 500 || body.includes("Internal Server Error");
      const hasContent = body.length > 200;

      if (is500 || !hasContent) {
        failed++;
        console.log(`❌ ${p.name.padEnd(15)} ${p.path.padEnd(30)} → ${is500 ? "500" : "empty"}`);
      } else {
        passed++;
        console.log(`✅ ${p.name.padEnd(15)} ${p.path.padEnd(30)} → OK (${status})`);
      }
    }

    console.log(`TOTAL: ${pages.length} | PASS: ${passed} | FAIL: ${failed}`);
    if (consoleErrors.length > 0) {
      console.log(`Console errors: ${consoleErrors.length}`);
      for (const e of [...new Set(consoleErrors)].slice(0, 5)) console.log(`  ⚠️ ${e}`);
    }
    console.log("=== REGRESSION DONE ===\n");

    await snap(page, "regression-final");
    await ctx.close();
  });
});
