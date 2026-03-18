import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_USER = { email: "qa-suite@smsok.test", password: process.env.E2E_USER_PASSWORD! };

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '"><img src=x onerror=alert(1)>',
  "javascript:alert(1)",
  '<svg onload=alert(1)>',
  "{{7*7}}",
  "${7*7}",
];

const SQLI_PAYLOADS = [
  "' OR 1=1 --",
  "'; DROP TABLE users; --",
  "1' UNION SELECT null,null,null --",
  "admin'--",
];

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
  await page.screenshot({ path: `screenshots/sec-${name}.png`, fullPage: true });
}

async function loginContext(browser: any): Promise<BrowserContext> {
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

// ===================== 1. XSS TESTS =====================
test.describe("Security: XSS Tests", () => {

  test("XSS in Register form fields", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const results: { field: string; payload: string; reflected: boolean }[] = [];

    await page.goto(`${BASE}/register`);
    await dismissCookies(page);

    for (const payload of XSS_PAYLOADS.slice(0, 3)) {
      // Name field
      const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill(payload);
      }

      // Email field
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(`xss-${Date.now()}@test.com`);

      // Check if script executed
      let dialogFired = false;
      page.once("dialog", async (d) => { dialogFired = true; await d.dismiss(); });

      await page.waitForTimeout(500);

      // Check if payload reflected raw in HTML
      const html = await page.content();
      const reflected = html.includes(payload) && !html.includes(encodeURIComponent(payload));

      results.push({ field: "register-name", payload, reflected });
      console.log(`${reflected || dialogFired ? "🔴 VULN" : "✅ SAFE"} Register name: ${payload.substring(0, 40)} → reflected=${reflected} dialog=${dialogFired}`);
    }

    await snap(page, "xss-register");
    await ctx.close();
  });

  test("XSS in Send SMS message field", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/send`);
    await dismissCookies(page);
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const msgField = page.locator("textarea").first();
    if (await msgField.isVisible({ timeout: 5000 }).catch(() => false)) {
      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        await msgField.fill(payload);
        await page.waitForTimeout(300);

        let dialogFired = false;
        page.once("dialog", async (d) => { dialogFired = true; await d.dismiss(); });
        await page.waitForTimeout(500);

        // Check preview area for raw HTML
        const previewText = await page.locator('[class*="preview"], [data-testid*="preview"]').first().textContent().catch(() => "");
        const reflected = previewText?.includes("<script>") || previewText?.includes("onerror=");

        console.log(`${reflected || dialogFired ? "🔴 VULN" : "✅ SAFE"} SMS message: ${payload.substring(0, 40)} → reflected=${reflected} dialog=${dialogFired}`);
      }
    } else {
      console.log("⚠️ No textarea found on SMS send page");
    }

    await snap(page, "xss-sms");
    await ctx.close();
  });

  test("XSS in Contacts name field", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Click add contact
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Quick Add"), button:has-text("Add")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const payload = XSS_PAYLOADS[0];
        await nameInput.fill(payload);

        let dialogFired = false;
        page.once("dialog", async (d) => { dialogFired = true; await d.dismiss(); });
        await page.waitForTimeout(500);

        const html = await page.content();
        const reflected = html.includes("<script>alert") && !html.includes("&lt;script&gt;");

        console.log(`${reflected || dialogFired ? "🔴 VULN" : "✅ SAFE"} Contact name XSS → reflected=${reflected} dialog=${dialogFired}`);
      }
    }

    await snap(page, "xss-contacts");
    await ctx.close();
  });

  test("XSS in Settings profile name", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const nameInput = page.locator('input[name="name"], input[name="displayName"], input[name="companyName"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const oldValue = await nameInput.inputValue();
      const payload = '<script>alert("xss")</script>';
      await nameInput.clear();
      await nameInput.fill(payload);

      let dialogFired = false;
      page.once("dialog", async (d) => { dialogFired = true; await d.dismiss(); });
      await page.waitForTimeout(500);

      console.log(`${dialogFired ? "🔴 VULN" : "✅ SAFE"} Settings name XSS → dialog=${dialogFired}`);

      // Restore original value
      await nameInput.clear();
      await nameInput.fill(oldValue || "QA Strict Assert Test");

      await snap(page, "xss-settings");
    } else {
      console.log("⚠️ No name input on settings page");
    }

    await ctx.close();
  });

  test("XSS in Support ticket", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/support/new`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const payload = '<img src=x onerror=alert("xss")>';

    const subjectInput = page.locator('input[name="subject"], input[name="title"], input[placeholder*="หัวข้อ"], input[placeholder*="เรื่อง"]').first();
    if (await subjectInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectInput.fill(payload);

      const descInput = page.locator("textarea").first();
      if (await descInput.isVisible().catch(() => false)) {
        await descInput.fill(payload);
      }

      let dialogFired = false;
      page.once("dialog", async (d) => { dialogFired = true; await d.dismiss(); });
      await page.waitForTimeout(500);

      console.log(`${dialogFired ? "🔴 VULN" : "✅ SAFE"} Support ticket XSS → dialog=${dialogFired}`);
    }

    await snap(page, "xss-support");
    await ctx.close();
  });

  test("XSS in search fields", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();

    const searchPages = [
      { url: "/dashboard/contacts", name: "contacts-search" },
      { url: "/dashboard/history", name: "history-search" },
      { url: "/dashboard/campaigns", name: "campaigns-search" },
    ];

    for (const sp of searchPages) {
      await page.goto(`${BASE}${sp.url}`);
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const searchInput = page.locator('input[type="search"], input[placeholder*="ค้นหา"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const payload = '<script>alert(1)</script>';
        await searchInput.fill(payload);
        await searchInput.press("Enter");
        await page.waitForTimeout(1000);

        let dialogFired = false;
        page.once("dialog", async (d) => { dialogFired = true; await d.dismiss(); });
        await page.waitForTimeout(500);

        console.log(`${dialogFired ? "🔴 VULN" : "✅ SAFE"} ${sp.name} search XSS → dialog=${dialogFired}`);
      } else {
        console.log(`⚠️ No search input on ${sp.url}`);
      }
    }

    await ctx.close();
  });
});

// ===================== 2. SQL INJECTION TESTS =====================
test.describe("Security: SQL Injection Tests", () => {

  test("SQLi in Login form", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(`${BASE}/login`);
    await dismissCookies(page);

    for (const payload of SQLI_PAYLOADS) {
      await page.locator('input[type="email"]').fill(payload);
      await page.locator('input[type="password"]').fill("anything");

      const submitBtn = page.locator('button[type="submit"]');
      // Button might be disabled due to email validation
      const disabled = await submitBtn.isDisabled().catch(() => true);

      if (!disabled) {
        await submitBtn.click({ force: true });
        await page.waitForTimeout(2000);

        const bodyText = await page.locator("body").textContent().catch(() => "") || "";
        const hasDbError = bodyText.includes("SQL") || bodyText.includes("syntax") ||
                          bodyText.includes("database") || bodyText.includes("Prisma") ||
                          bodyText.includes("SQLITE") || bodyText.includes("postgres");

        console.log(`${hasDbError ? "🔴 VULN" : "✅ SAFE"} Login SQLi: ${payload} → dbError=${hasDbError}`);

        if (hasDbError) await snap(page, `sqli-login-${SQLI_PAYLOADS.indexOf(payload)}`);
      } else {
        console.log(`✅ SAFE Login SQLi: ${payload} → submit blocked (validation)`);
      }
    }

    await ctx.close();
  });

  test("SQLi in API search endpoints", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();

    // Use authenticated page context for API calls
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded").catch(() => {});

    const endpoints = [
      "/api/v1/contacts?search=",
      "/api/v1/sms/history?search=",
      "/api/v1/campaigns?search=",
      "/api/v1/logs?search=",
    ];

    for (const endpoint of endpoints) {
      for (const payload of SQLI_PAYLOADS.slice(0, 2)) {
        try {
          const resp = await page.request.fetch(`${BASE}${endpoint}${encodeURIComponent(payload)}`);
          const status = resp.status();
          const body = await resp.text().catch(() => "");

          const hasDbError = body.includes("SQL") || body.includes("syntax error") ||
                            body.includes("database") || body.includes("PrismaClientKnownRequestError") ||
                            status === 500;

          console.log(`${hasDbError ? "🔴 VULN" : "✅ SAFE"} ${endpoint}${payload.substring(0, 20)} → ${status} dbError=${hasDbError}`);
        } catch (err: any) {
          console.log(`❌ ${endpoint} → ERROR: ${err.message?.substring(0, 80)}`);
        }
      }
    }

    await ctx.close();
  });
});

// ===================== 3. AUTH BYPASS TESTS =====================
test.describe("Security: Auth Bypass Tests", () => {

  test("Protected dashboard pages without auth", async ({ browser }) => {
    const ctx = await browser.newContext(); // No auth
    const page = await ctx.newPage();

    const protectedPages = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/contacts",
      "/dashboard/campaigns",
      "/dashboard/settings",
      "/dashboard/api-keys",
      "/dashboard/webhooks",
      "/dashboard/support",
      "/dashboard/orders",
      "/dashboard/senders",
      "/dashboard/history",
      "/dashboard/packages/my",
      "/dashboard/billing",
    ];

    console.log("\n=== AUTH BYPASS: Dashboard Pages ===");
    const exposed: string[] = [];

    for (const p of protectedPages) {
      await page.goto(`${BASE}${p}`, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const url = page.url();
      const redirected = url.includes("/login") || url === `${BASE}/` || url.includes("/register");

      if (!redirected) {
        // Check if actual content is visible (not just a redirect delay)
        const bodyText = await page.locator("body").textContent().catch(() => "") || "";
        const hasProtectedContent = bodyText.includes("dashboard") || bodyText.includes("ภาพรวม") ||
                                    bodyText.includes("ผู้ติดต่อ") || bodyText.includes("แคมเปญ");

        if (hasProtectedContent) {
          exposed.push(p);
          console.log(`🔴 EXPOSED ${p} → ${url} (has protected content!)`);
          await snap(page, `auth-bypass-${p.replace(/\//g, "-")}`);
        } else {
          console.log(`✅ SAFE ${p} → ${url} (no protected content)`);
        }
      } else {
        console.log(`✅ SAFE ${p} → redirected to ${url}`);
      }
    }

    if (exposed.length > 0) {
      console.log(`\n🔴 AUTH BYPASS FOUND: ${exposed.length} pages exposed!`);
    } else {
      console.log("\n✅ All protected pages properly guarded");
    }

    await ctx.close();
  });

  test("Protected API endpoints without auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`); // Need a page context for fetch

    const protectedApis = [
      { method: "GET", path: "/api/v1/contacts" },
      { method: "GET", path: "/api/v1/campaigns" },
      { method: "GET", path: "/api/v1/api-keys" },
      { method: "GET", path: "/api/v1/settings/profile" },
      { method: "GET", path: "/api/v1/sms/history" },
      { method: "GET", path: "/api/v1/webhooks" },
      { method: "GET", path: "/api/v1/tickets" },
      { method: "GET", path: "/api/v1/orders" },
      { method: "GET", path: "/api/v1/credits/balance" },
      { method: "GET", path: "/api/auth/me" },
      { method: "POST", path: "/api/v1/sms/send" },
      { method: "POST", path: "/api/v1/contacts" },
      { method: "DELETE", path: "/api/v1/contacts/1" },
    ];

    console.log("\n=== AUTH BYPASS: API Endpoints ===");
    const exposed: string[] = [];

    for (const api of protectedApis) {
      try {
        const resp = await page.request.fetch(`${BASE}${api.path}`, {
          method: api.method as any,
          headers: { "Content-Type": "application/json" },
          data: api.method === "POST" ? "{}" : undefined,
        });
        const status = resp.status();

        if (status === 200) {
          exposed.push(`${api.method} ${api.path}`);
          console.log(`🔴 EXPOSED ${api.method} ${api.path} → ${status}`);
        } else {
          console.log(`✅ SAFE ${api.method} ${api.path.padEnd(35)} → ${status}`);
        }
      } catch (err: any) {
        console.log(`❌ ${api.method} ${api.path} → ERROR`);
      }
    }

    if (exposed.length > 0) {
      console.log(`\n🔴 API AUTH BYPASS: ${exposed.length} endpoints exposed!`);
    } else {
      console.log("\n✅ All API endpoints properly guarded");
    }

    await ctx.close();
  });

  test("IDOR: access other user data by changing IDs", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("domcontentloaded").catch(() => {});

    console.log("\n=== IDOR TESTS ===");

    // Try accessing contacts/campaigns/orders with arbitrary IDs
    const idorTests = [
      { path: "/api/v1/contacts/1", name: "contact-1" },
      { path: "/api/v1/contacts/999", name: "contact-999" },
      { path: "/api/v1/campaigns/1", name: "campaign-1" },
      { path: "/api/v1/campaigns/999", name: "campaign-999" },
      { path: "/api/v1/api-keys/1", name: "apikey-1" },
      { path: "/api/v1/tickets/1", name: "ticket-1" },
      { path: "/api/v1/tickets/999", name: "ticket-999" },
      { path: "/api/v1/orders/1", name: "order-1" },
      { path: "/api/v1/webhooks/1", name: "webhook-1" },
    ];

    for (const t of idorTests) {
      try {
        const resp = await page.request.fetch(`${BASE}${t.path}`);
        const status = resp.status();
        const body = await resp.text().catch(() => "");

        // 200 with data = potential IDOR, 404/403 = safe
        if (status === 200) {
          // Check if returned data belongs to another user
          const data = JSON.parse(body).data || JSON.parse(body);
          console.log(`⚠️ CHECK ${t.path.padEnd(30)} → ${status} (review if data belongs to current user)`);
        } else {
          console.log(`✅ SAFE ${t.path.padEnd(30)} → ${status}`);
        }
      } catch (err: any) {
        console.log(`✅ SAFE ${t.path.padEnd(30)} → error/blocked`);
      }
    }

    await ctx.close();
  });
});

// ===================== 4. SPECIAL CHARS & ENCODING =====================
test.describe("Security: Special Characters & Encoding", () => {

  test("Unicode/Emoji in form fields", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Quick Add")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Test unicode/emoji
        const unicodePayloads = [
          "ทดสอบชื่อไทย 🎯🔥",
          "日本語テスト",
          "مرحبا",
          "\u0000\u0001\u0002",
          "A".repeat(1000),
        ];

        for (const payload of unicodePayloads) {
          await nameInput.clear();
          await nameInput.fill(payload);
          const value = await nameInput.inputValue();
          const accepted = value.length > 0;
          console.log(`${accepted ? "✅" : "⚠️"} Contact name: ${payload.substring(0, 30)}... → accepted=${accepted} len=${value.length}`);
        }
      }
    }

    await snap(page, "unicode-contacts");
    await ctx.close();
  });

  test("Path traversal in API", async ({ browser }) => {
    const ctx = await loginContext(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);

    const traversalPaths = [
      "/api/v1/contacts/../../etc/passwd",
      "/api/v1/contacts/..%2F..%2Fetc%2Fpasswd",
      "/api/storage/../../../etc/passwd",
    ];

    console.log("\n=== PATH TRAVERSAL TESTS ===");
    for (const path of traversalPaths) {
      try {
        const resp = await page.request.fetch(`${BASE}${path}`);
        const status = resp.status();
        const body = await resp.text().catch(() => "");
        const hasLeak = body.includes("root:") || body.includes("/bin/bash");

        console.log(`${hasLeak ? "🔴 VULN" : "✅ SAFE"} ${path.substring(0, 50)} → ${status} leak=${hasLeak}`);
      } catch {
        console.log(`✅ SAFE ${path.substring(0, 50)} → blocked`);
      }
    }

    await ctx.close();
  });
});
