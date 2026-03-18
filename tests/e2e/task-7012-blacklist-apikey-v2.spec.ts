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

async function getApiKey(page: Page): Promise<string | null> {
  const listResp = await page.request.fetch(`${BASE}/api/v1/api-keys`);
  const body = await listResp.json().catch(() => ({}));
  const keys = Array.isArray(body) ? body : (body.data || body.apiKeys || []);
  // Find a key that has the actual key value
  for (const k of keys) {
    if (k.key) return k.key;
  }
  // If no key with value, create one
  const createResp = await page.request.fetch(`${BASE}/api/v1/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ name: `QA-BL-Test-${Date.now()}` }),
  });
  const createBody = await createResp.json().catch(() => ({}));
  return createBody.key || createBody.data?.key || null;
}

test("Blacklist CRUD with API Key auth", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  // Get API key
  const apiKey = await getApiKey(page);
  console.log(`\n=== BLACKLIST CRUD (API Key Auth) ===`);
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + "..." : "NOT FOUND"}`);

  if (!apiKey) {
    console.log("❌ Cannot get API key — skipping blacklist API tests");
    await ctx.close();
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };

  const testPhone = "0891234567";

  // 1. CREATE
  const createResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "POST",
    headers: authHeaders,
    data: JSON.stringify({ phone: testPhone, reason: "QA CRUD test" }),
  });
  const createStatus = createResp.status();
  const createBody = await createResp.json().catch(() => ({}));
  console.log(`POST create: ${createStatus} → ${JSON.stringify(createBody).substring(0, 200)}`);
  console.log(`${createStatus === 200 || createStatus === 201 ? "✅" : "❌"} CREATE: ${createStatus}`);

  // 2. LIST
  const listResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    headers: { "x-api-key": apiKey },
  });
  const listStatus = listResp.status();
  const listBody = await listResp.json().catch(() => ({}));
  const entries = Array.isArray(listBody) ? listBody : (listBody.data || listBody.blacklist || []);
  const found = entries.some((e: any) => e.phone === testPhone || e.phone?.includes("891234567"));
  console.log(`GET list: ${listStatus} → ${entries.length} entries, found=${found}`);
  console.log(`${listStatus === 200 && found ? "✅" : "❌"} LIST: found=${found}`);

  // 3. UPSERT — same phone again (should NOT 409)
  const upsertResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "POST",
    headers: authHeaders,
    data: JSON.stringify({ phone: testPhone, reason: "Updated reason" }),
  });
  const upsertStatus = upsertResp.status();
  console.log(`POST upsert: ${upsertStatus}`);
  console.log(`${upsertStatus !== 409 ? "✅" : "❌"} UPSERT no 409: ${upsertStatus}`);

  // 4. DELETE
  const deleteResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "DELETE",
    headers: authHeaders,
    data: JSON.stringify({ phone: testPhone }),
  });
  const deleteStatus = deleteResp.status();
  console.log(`DELETE: ${deleteStatus}`);
  console.log(`${deleteStatus === 200 || deleteStatus === 204 ? "✅" : "❌"} DELETE: ${deleteStatus}`);

  // 5. VERIFY deleted
  const verifyResp = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    headers: { "x-api-key": apiKey },
  });
  const verifyBody = await verifyResp.json().catch(() => ({}));
  const verifyEntries = Array.isArray(verifyBody) ? verifyBody : (verifyBody.data || verifyBody.blacklist || []);
  const stillExists = verifyEntries.some((e: any) => e.phone === testPhone || e.phone?.includes("891234567"));
  console.log(`${!stillExists ? "✅" : "❌"} VERIFY DELETED: gone=${!stillExists}`);

  console.log("=== BLACKLIST CRUD DONE ===\n");
  await ctx.close();
});

test("Blacklist edge cases with API Key", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  const apiKey = await getApiKey(page);
  if (!apiKey) { console.log("❌ No API key"); await ctx.close(); return; }

  const authHeaders = { "Content-Type": "application/json", "x-api-key": apiKey };

  console.log("\n=== BLACKLIST EDGE CASES ===");

  // Empty phone
  const r1 = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "POST", headers: authHeaders,
    data: JSON.stringify({ phone: "", reason: "test" }),
  });
  console.log(`${r1.status() >= 400 && r1.status() < 500 ? "✅" : "❌"} Empty phone: ${r1.status()}`);

  // Missing phone
  const r2 = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "POST", headers: authHeaders,
    data: JSON.stringify({ reason: "test" }),
  });
  console.log(`${r2.status() >= 400 && r2.status() < 500 ? "✅" : "❌"} Missing phone: ${r2.status()}`);

  // XSS in reason
  const r3 = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "POST", headers: authHeaders,
    data: JSON.stringify({ phone: "0891111111", reason: '<script>alert("xss")</script>' }),
  });
  const r3Body = await r3.text().catch(() => "");
  console.log(`${!r3Body.includes("<script>") ? "✅" : "❌"} XSS in reason: ${r3.status()} scriptInResponse=${r3Body.includes("<script>")}`);

  // SQLi in phone
  const r4 = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "POST", headers: authHeaders,
    data: JSON.stringify({ phone: "'; DROP TABLE phone_blacklist;--", reason: "sqli" }),
  });
  console.log(`${r4.status() >= 400 ? "✅" : "⚠️"} SQLi phone: ${r4.status()}`);

  // +66 format
  const r5 = await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
    method: "POST", headers: authHeaders,
    data: JSON.stringify({ phone: "+66891234567", reason: "international format" }),
  });
  console.log(`${r5.status() === 200 || r5.status() === 201 ? "✅" : "⚠️"} +66 format: ${r5.status()}`);

  // Cleanup
  for (const p of ["0891111111", "+66891234567"]) {
    await page.request.fetch(`${BASE}/api/v1/contacts/blacklist`, {
      method: "DELETE", headers: authHeaders,
      data: JSON.stringify({ phone: p }),
    });
  }

  console.log("=== EDGE CASES DONE ===\n");
  await ctx.close();
});

test("API Key GET by ID — detailed check", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  console.log("\n=== API KEY GET BY ID (DETAILED) ===");

  // List keys
  const listResp = await page.request.fetch(`${BASE}/api/v1/api-keys`);
  const listBody = await listResp.json().catch(() => ({}));
  const keys = Array.isArray(listBody) ? listBody : (listBody.data || listBody.apiKeys || []);
  console.log(`Total keys: ${keys.length}`);

  if (keys.length > 0) {
    const key = keys[0];
    const keyId = key.id;

    // GET existing key
    const getResp = await page.request.fetch(`${BASE}/api/v1/api-keys/${keyId}`);
    const getStatus = getResp.status();
    const getBody = await getResp.json().catch(() => ({}));
    console.log(`GET /api/v1/api-keys/${keyId}: ${getStatus}`);
    console.log(`Response: ${JSON.stringify(getBody).substring(0, 300)}`);
    console.log(`${getStatus === 200 ? "✅" : "❌"} Existing key returns 200: ${getStatus}`);

    // Verify response has expected fields
    const data = getBody.data || getBody;
    const hasId = !!data.id;
    const hasName = !!data.name;
    console.log(`${hasId ? "✅" : "❌"} Response has id: ${hasId}`);
    console.log(`${hasName ? "✅" : "❌"} Response has name: ${hasName}`);
  }

  // Non-existent key
  const r1 = await page.request.fetch(`${BASE}/api/v1/api-keys/nonexistent-id`);
  console.log(`GET nonexistent: ${r1.status()} (want 404, was 405 before fix)`);
  console.log(`${r1.status() === 404 ? "✅" : "⚠️"} Non-existent returns: ${r1.status()}`);

  // Numeric non-existent
  const r2 = await page.request.fetch(`${BASE}/api/v1/api-keys/999999`);
  console.log(`GET 999999: ${r2.status()}`);
  console.log(`${r2.status() === 404 ? "✅" : "⚠️"} Numeric non-existent: ${r2.status()}`);

  // IDOR — try another user's key format
  const r3 = await page.request.fetch(`${BASE}/api/v1/api-keys/cmmxxxxxxxxxxxxxxxxx`);
  console.log(`GET fake cuid: ${r3.status()}`);
  console.log(`${r3.status() === 404 || r3.status() === 400 ? "✅" : "❌"} IDOR check: ${r3.status()}`);

  console.log("=== API KEY GET BY ID DONE ===\n");
  await ctx.close();
});
