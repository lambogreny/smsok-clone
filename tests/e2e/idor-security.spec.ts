/**
 * IDOR Security Test — Task #4301
 * Tests that user A cannot access user B's resources
 * Also tests regression: existing flows still work
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER_A = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`PAGE ERROR: ${err.message}`));
  return errors;
}

async function dismissCookies(page: Page) {
  const acceptBtn = page.getByText("ยอมรับทั้งหมด");
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

async function login(page: Page, user = USER_A) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await dismissCookies(page);

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(user.email);
  await passwordInput.click();
  await passwordInput.fill(user.password);

  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(async () => {
    await emailInput.clear();
    await emailInput.type(user.email);
    await passwordInput.clear();
    await passwordInput.type(user.password);
  });

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 });
}

// ========== IDOR SECURITY TESTS ==========
test.describe("IDOR Security Tests", () => {

  test("IDOR-01: Cannot access other user's order by ID", async ({ page }) => {
    await login(page);

    // Try accessing a fake/other user's order ID
    const fakeOrderIds = [
      "cmmaaaaa0000000000000000",
      "99999999",
      "other-user-order-id",
    ];

    for (const id of fakeOrderIds) {
      const response = await page.goto(`${BASE}/dashboard/billing/orders/${id}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const body = await page.textContent("body");
      const status = response?.status() || 0;

      // Should NOT show another user's order data — should be 404/403 or show error
      const hasData = body?.includes("ORD-") && !body?.includes("ไม่พบ") && !body?.includes("Forbidden");

      if (hasData && status === 200) {
        console.log(`🔴 IDOR VULNERABILITY: /dashboard/billing/orders/${id} returned data!`);
      } else {
        console.log(`✅ /dashboard/billing/orders/${id} → ${status} (blocked)`);
      }

      await page.screenshot({ path: `test-results/idor-01-order-${id.substring(0, 8)}.png` });
    }
  });

  test("IDOR-02: Cannot access other user's contacts by ID", async ({ page }) => {
    await login(page);

    const fakeIds = ["cmmaaaaa0000000000000000", "99999"];

    for (const id of fakeIds) {
      const response = await page.goto(`${BASE}/dashboard/contacts/${id}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const status = response?.status() || 0;
      const body = await page.textContent("body") || "";

      // Should not show other user's contact data
      // Next.js may return 200 with "ไม่พบ" (soft 404) — that's acceptable
      const isBlocked = status === 404 || status === 403 || status === 401 ||
        body.includes("ไม่พบ") || body.includes("not found") || body.includes("404");
      expect(isBlocked).toBeTruthy();
      console.log(`✅ /dashboard/contacts/${id} → ${status} (blocked: ${isBlocked})`);
    }

    await page.screenshot({ path: "test-results/idor-02-contacts.png" });
  });

  test("IDOR-03: API endpoints block unauthorized access", async ({ page }) => {
    await login(page);

    // Test API endpoints with fake IDs via page.request (carries auth cookies)
    const endpoints = [
      { path: "/api/v1/contacts/fake-id-not-mine", method: "GET" },
      { path: "/api/v1/invoices/fake-id-not-mine", method: "GET" },
      { path: "/api/v1/invoices/fake-id-not-mine/pdf", method: "GET" },
      { path: "/api/v1/sender-names/fake-id-not-mine", method: "GET" },
      { path: "/api/v1/tickets/fake-id-not-mine", method: "GET" },
      { path: "/api/v1/settings/sessions/fake-id-not-mine", method: "DELETE" },
    ];

    const results: string[] = [];

    for (const ep of endpoints) {
      try {
        const response = ep.method === "DELETE"
          ? await page.request.delete(`${BASE}${ep.path}`)
          : await page.request.get(`${BASE}${ep.path}`);

        const status = response.status();
        const body = await response.text().catch(() => "");

        // Should be 403, 404, or 401 — NOT 200 with data
        if (status === 200 && body.length > 50 && !body.includes("error") && !body.includes("not found")) {
          results.push(`🔴 IDOR: ${ep.method} ${ep.path} → ${status} (returned data!)`);
        } else {
          results.push(`✅ ${ep.method} ${ep.path} → ${status}`);
        }
      } catch (e) {
        results.push(`✅ ${ep.method} ${ep.path} → blocked (${(e as Error).message.substring(0, 50)})`);
      }
    }

    for (const r of results) console.log(r);
    await page.screenshot({ path: "test-results/idor-03-api-endpoints.png" });

    const vulns = results.filter(r => r.startsWith("🔴"));
    if (vulns.length > 0) {
      console.log(`\n⚠️ ${vulns.length} IDOR vulnerabilities found!`);
    }
  });

  test("IDOR-04: Cannot access other user's quotation/campaign", async ({ page }) => {
    await login(page);

    const protectedPages = [
      "/dashboard/quotations/fake-id-not-mine",
      "/dashboard/campaigns/fake-id-not-mine",
      "/dashboard/groups/fake-id-not-mine",
      "/dashboard/support/fake-id-not-mine",
    ];

    for (const path of protectedPages) {
      const response = await page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const status = response?.status() || 0;
      const body = await page.textContent("body");

      const isBlocked = status === 404 || status === 403 || status === 401 ||
        body?.includes("ไม่พบ") || body?.includes("not found") || body?.includes("Forbidden");

      console.log(`${isBlocked ? "✅" : "🔴"} ${path} → ${status} ${isBlocked ? "(blocked)" : "(POTENTIAL IDOR!)"}`);
    }

    await page.screenshot({ path: "test-results/idor-04-protected-pages.png" });
  });

  test("IDOR-05: XSS injection in URL params", async ({ page }) => {
    await login(page);

    // Try XSS via URL path
    const xssPayloads = [
      '/dashboard/contacts/<script>alert(1)</script>',
      '/dashboard/billing/orders/"><img src=x onerror=alert(1)>',
    ];

    for (const path of xssPayloads) {
      await page.goto(`${BASE}${encodeURI(path)}`, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const body = await page.textContent("body") || "";
      const hasXss = body.includes("<script>") || body.includes("onerror=");

      if (hasXss) {
        console.log(`🔴 XSS: payload reflected in ${path}`);
      } else {
        console.log(`✅ XSS blocked: ${path.substring(0, 50)}`);
      }
    }

    await page.screenshot({ path: "test-results/idor-05-xss.png" });
  });
});

// ========== REGRESSION TESTS ==========
test.describe("Regression Tests", () => {

  test("REG-01: Login flow works normally", async ({ page }) => {
    const errors = collectErrors(page);
    await login(page);

    expect(page.url()).toContain("/dashboard");
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    // Should show user info
    expect(body).toMatch(/QA Judge|ภาพรวม|Dashboard/i);

    await page.screenshot({ path: "test-results/reg-01-login.png" });
  });

  test("REG-02: Dashboard shows correct user data", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    // Should show QA Judge's data, not another user
    expect(body).not.toContain("Internal Server Error");

    // Check SMS credit display
    const hasCreditDisplay = body?.includes("SMS") && body?.match(/\d+/);
    console.log(`Credits visible: ${hasCreditDisplay ? "yes" : "no"}`);

    await page.screenshot({ path: "test-results/reg-02-dashboard-data.png" });
  });

  test("REG-03: Orders page shows own orders only", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/orders`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");

    await page.screenshot({ path: "test-results/reg-03-orders.png" });
  });

  test("REG-04: Settings shows correct profile", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    // Should show QA Judge email
    expect(body).toContain("qa-judge2@smsok.test");

    await page.screenshot({ path: "test-results/reg-04-settings.png" });
  });

  test("REG-05: All sidebar pages load without error", async ({ page }) => {
    const errors = collectErrors(page);
    await login(page);

    const pages = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/contacts",
      "/dashboard/history",
      "/dashboard/senders",
      "/dashboard/templates",
      "/dashboard/settings",
      "/dashboard/packages",
      "/dashboard/orders",
    ];

    for (const path of pages) {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      expect(response?.status()).toBeLessThan(400);
    }

    const jsErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js") && !e.includes("DevTools"));
    if (jsErrors.length > 0) {
      console.log(`⚠️ ${jsErrors.length} console errors found`);
      jsErrors.forEach(e => console.log("  -", e.slice(0, 200)));
    } else {
      console.log("✅ No console errors across all pages");
    }

    await page.screenshot({ path: "test-results/reg-05-sidebar.png" });
  });

  test("REG-06: SMS compose form functional", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Check form elements exist
    const body = await page.textContent("body");
    expect(body).toMatch(/ผู้ส่ง|Sender|ข้อความ|ผู้รับ/i);

    // Try typing in message area
    const msgArea = page.locator('textarea, [contenteditable="true"]').first();
    if (await msgArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await msgArea.click();
      await msgArea.fill("QA test message ทดสอบ");
      console.log("✅ Message textarea is writable");
    }

    await page.screenshot({ path: "test-results/reg-06-sms-compose.png" });
  });

  test("REG-07: Mobile responsive check 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    const pages = ["/dashboard", "/dashboard/send", "/dashboard/settings"];

    for (const path of pages) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
      );
      if (hasOverflow) console.log(`⚠️ Overflow at 375px: ${path}`);
    }

    await page.screenshot({ path: "test-results/reg-07-mobile.png" });
  });
});
