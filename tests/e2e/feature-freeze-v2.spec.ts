import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_USER = {
  email: "qa-suite@smsok.test",
  password: process.env.E2E_USER_PASSWORD!,
};

async function dismissCookies(page: Page) {
  // Try multiple cookie consent button texts
  for (const text of ["ยอมรับทั้งหมด", "ยอมรับ", "Accept All", "Accept"]) {
    const btn = page.getByText(text, { exact: false });
    if (await btn.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.first().click({ force: true });
      await page.waitForTimeout(500);
      return;
    }
  }
  // Fallback: dismiss by clicking any accept-like button in cookie dialog
  const dialog = page.locator('[role="dialog"][aria-label*="คุกกี้"], [role="dialog"][aria-label*="cookie"]');
  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    const acceptBtn = dialog.locator("button").first();
    await acceptBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function snap(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/v2-${name}.png`, fullPage: true });
}

async function login(browser: any): Promise<BrowserContext> {
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
  if (page.url().includes("/dashboard")) {
    await ctx.storageState({ path: "tests/e2e/.auth/freeze-v2.json" });
  }
  await page.close();
  return ctx;
}

// ===================== ALL PAGES COMPREHENSIVE SCAN =====================
test.describe("Feature Freeze V2 — All Pages Scan", () => {

  test("Login + scan ALL dashboard pages", async ({ browser }) => {
    // Login first
    const ctx = await login(browser);
    const page = await ctx.newPage();
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Filter out hydration warnings
        if (!text.includes("hydrat") && !text.includes("Hydrat")) {
          consoleErrors.push(text.substring(0, 200));
        }
      }
    });

    // All real dashboard pages from the file structure
    const allPages = [
      { path: "/dashboard", name: "dashboard-home" },
      { path: "/dashboard/send-sms", name: "send-sms" },
      { path: "/dashboard/send", name: "send" },
      { path: "/dashboard/sms/scheduled", name: "sms-scheduled" },
      { path: "/dashboard/sms/calendar", name: "sms-calendar" },
      { path: "/dashboard/scheduled", name: "scheduled" },
      { path: "/dashboard/history", name: "history" },
      { path: "/dashboard/otp", name: "otp" },
      { path: "/dashboard/templates", name: "templates" },
      { path: "/dashboard/contacts", name: "contacts" },
      { path: "/dashboard/contacts/groups", name: "contacts-groups" },
      { path: "/dashboard/contacts/blacklist", name: "contacts-blacklist" },
      { path: "/dashboard/contacts/import", name: "contacts-import" },
      { path: "/dashboard/groups", name: "groups" },
      { path: "/dashboard/tags", name: "tags" },
      { path: "/dashboard/senders", name: "senders" },
      { path: "/dashboard/sender-names", name: "sender-names" },
      { path: "/dashboard/campaigns", name: "campaigns" },
      { path: "/dashboard/campaigns/calendar", name: "campaigns-calendar" },
      { path: "/dashboard/campaigns/recurring", name: "campaigns-recurring" },
      { path: "/dashboard/campaign", name: "campaign-legacy" },
      { path: "/dashboard/packages", name: "packages" },
      { path: "/dashboard/packages/my", name: "my-packages" },
      { path: "/dashboard/orders", name: "orders" },
      { path: "/dashboard/billing", name: "billing" },
      { path: "/dashboard/billing/packages", name: "billing-packages" },
      { path: "/dashboard/billing/orders", name: "billing-orders" },
      { path: "/dashboard/billing/history", name: "billing-history" },
      { path: "/dashboard/billing/my-packages", name: "billing-my-packages" },
      { path: "/dashboard/billing/topup", name: "billing-topup" },
      { path: "/dashboard/billing/checkout", name: "billing-checkout" },
      { path: "/dashboard/credits", name: "credits" },
      { path: "/dashboard/topup", name: "topup" },
      { path: "/dashboard/invoices", name: "invoices" },
      { path: "/dashboard/quotations", name: "quotations" },
      { path: "/dashboard/api-keys", name: "api-keys" },
      { path: "/dashboard/webhooks", name: "webhooks" },
      { path: "/dashboard/api-docs", name: "api-docs" },
      { path: "/dashboard/api-logs", name: "api-logs" },
      { path: "/dashboard/logs", name: "logs" },
      { path: "/dashboard/settings", name: "settings" },
      { path: "/dashboard/settings/security", name: "settings-security" },
      { path: "/dashboard/settings/privacy", name: "settings-privacy" },
      { path: "/dashboard/settings/notifications", name: "settings-notifications" },
      { path: "/dashboard/settings/billing", name: "settings-billing" },
      { path: "/dashboard/settings/team", name: "settings-team" },
      { path: "/dashboard/settings/api-keys", name: "settings-api-keys" },
      { path: "/dashboard/settings/webhooks", name: "settings-webhooks" },
      { path: "/dashboard/settings/activity", name: "settings-activity" },
      { path: "/dashboard/settings/consent", name: "settings-consent" },
      { path: "/dashboard/settings/pdpa", name: "settings-pdpa" },
      { path: "/dashboard/support", name: "support" },
      { path: "/dashboard/support/new", name: "support-new" },
      { path: "/dashboard/support/kb", name: "support-kb" },
      { path: "/dashboard/notifications", name: "notifications" },
      { path: "/dashboard/analytics", name: "analytics" },
      { path: "/dashboard/reports", name: "reports" },
      { path: "/dashboard/messages", name: "messages" },
      { path: "/dashboard/activity", name: "activity" },
      { path: "/dashboard/profile", name: "profile" },
      { path: "/dashboard/onboarding", name: "onboarding" },
      { path: "/dashboard/docs", name: "docs" },
      { path: "/dashboard/welcome", name: "welcome" },
      { path: "/dashboard/test-sms", name: "test-sms" },
      { path: "/dashboard/checkout", name: "checkout" },
    ];

    const results: {
      path: string;
      name: string;
      httpStatus: number;
      finalUrl: string;
      is404: boolean;
      is500: boolean;
      hasContent: boolean;
      prismaError: boolean;
      jsError: boolean;
    }[] = [];

    for (const p of allPages) {
      const pageErrors: string[] = [];
      const errorListener = (msg: any) => {
        if (msg.type() === "error") pageErrors.push(msg.text().substring(0, 300));
      };
      page.on("console", errorListener);

      try {
        const resp = await page.goto(`${BASE}${p.path}`, { timeout: 15000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1500);

        const status = resp?.status() || 0;
        const url = page.url();
        const bodyText = await page.locator("body").textContent().catch(() => "") || "";

        const is404 = bodyText.includes("404") || bodyText.includes("ไม่พบหน้า");
        const is500 = status >= 500 || bodyText.includes("Internal Server Error");
        const prismaError = bodyText.includes("Prisma") || pageErrors.some(e => e.includes("Prisma"));
        const jsError = pageErrors.length > 0;
        const hasContent = bodyText.length > 100;

        // Screenshot failures
        if (is404 || is500 || prismaError) {
          await snap(page, `FAIL-${p.name}`);
        }

        results.push({
          path: p.path,
          name: p.name,
          httpStatus: status,
          finalUrl: url,
          is404,
          is500,
          hasContent,
          prismaError,
          jsError,
        });
      } catch (err: any) {
        results.push({
          path: p.path,
          name: p.name,
          httpStatus: 0,
          finalUrl: "TIMEOUT",
          is404: false,
          is500: true,
          hasContent: false,
          prismaError: false,
          jsError: true,
        });
      }

      page.removeListener("console", errorListener);
    }

    // Print comprehensive report
    console.log("\n" + "=".repeat(100));
    console.log("FEATURE FREEZE BUG SCAN — ALL PAGES REPORT");
    console.log("=".repeat(100));

    const bugs: string[] = [];

    for (const r of results) {
      const status = r.is404 ? "🔴 404" : r.is500 ? "🔴 500" : r.prismaError ? "🟡 PRISMA" : r.jsError ? "🟡 JS-ERR" : "✅ OK";
      const line = `${status.padEnd(15)} ${r.httpStatus} ${r.path.padEnd(45)} → ${r.finalUrl}`;
      console.log(line);

      if (r.is404) bugs.push(`🔴 404: ${r.path}`);
      if (r.is500) bugs.push(`🔴 500: ${r.path}`);
      if (r.prismaError) bugs.push(`🟡 PRISMA ERROR: ${r.path}`);
    }

    console.log("\n" + "=".repeat(100));
    console.log(`TOTAL: ${results.length} pages | BUGS: ${bugs.length}`);
    console.log("BUGS FOUND:");
    for (const b of bugs) console.log(`  ${b}`);
    console.log("=".repeat(100));

    // Unique console errors
    const uniqueErrors = [...new Set(consoleErrors)].slice(0, 20);
    if (uniqueErrors.length > 0) {
      console.log("\nCONSOLE ERRORS (unique, non-hydration):");
      for (const e of uniqueErrors) console.log(`  ⚠️ ${e}`);
    }

    await ctx.close();
  });
});

// ===================== API TESTS VIA PLAYWRIGHT (with cookies) =====================
test.describe("Layer 1 — API Tests via Browser Context", () => {

  test("API endpoint smoke test", async ({ browser }) => {
    const ctx = await login(browser);
    const page = await ctx.newPage();

    // Wait for dashboard to confirm login
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const apiTests = [
      { method: "GET", path: "/api/health", expectStatus: 200 },
      { method: "GET", path: "/api/auth/me", expectStatus: 200 },
      { method: "GET", path: "/api/v1/dashboard/summary", expectStatus: 200 },
      { method: "GET", path: "/api/v1/senders", expectStatus: 200 },
      { method: "GET", path: "/api/v1/contacts", expectStatus: 200 },
      { method: "GET", path: "/api/v1/packages", expectStatus: 200 },
      { method: "GET", path: "/api/v1/sms/history", expectStatus: 200 },
      { method: "GET", path: "/api/v1/campaigns", expectStatus: 200 },
      { method: "GET", path: "/api/v1/api-keys", expectStatus: 200 },
      { method: "GET", path: "/api/v1/templates", expectStatus: 200 },
      { method: "GET", path: "/api/v1/tickets", expectStatus: 200 },
      { method: "GET", path: "/api/v1/webhooks", expectStatus: 200 },
      { method: "GET", path: "/api/v1/groups", expectStatus: 200 },
      { method: "GET", path: "/api/v1/tags", expectStatus: 200 },
      { method: "GET", path: "/api/v1/credits/balance", expectStatus: 200 },
      { method: "GET", path: "/api/v1/invoices", expectStatus: 200 },
      { method: "GET", path: "/api/v1/orders", expectStatus: 200 },
      { method: "GET", path: "/api/v1/settings/profile", expectStatus: 200 },
      { method: "GET", path: "/api/v1/settings/notifications", expectStatus: 200 },
      { method: "GET", path: "/api/v1/settings/sessions", expectStatus: 200 },
      { method: "GET", path: "/api/v1/audit-logs", expectStatus: 200 },
      { method: "GET", path: "/api/v1/analytics", expectStatus: 200 },
      { method: "GET", path: "/api/v1/logs", expectStatus: 200 },
      { method: "GET", path: "/api/v1/sender-names/999999", expectStatus: [404, 400, 403] },
      { method: "GET", path: "/api/v1/contacts/999999", expectStatus: [404, 400, 403] },
    ];

    console.log("\n" + "=".repeat(80));
    console.log("LAYER 1 — API SMOKE TEST RESULTS");
    console.log("=".repeat(80));

    const apiBugs: string[] = [];

    for (const t of apiTests) {
      try {
        const resp = await page.request.fetch(`${BASE}${t.path}`, { method: t.method as any });
        const status = resp.status();
        const body = await resp.text().catch(() => "");
        const bodyPreview = body.substring(0, 150);

        const expectedStatuses = Array.isArray(t.expectStatus) ? t.expectStatus : [t.expectStatus];
        const pass = expectedStatuses.includes(status);
        const icon = pass ? "✅" : "❌";

        console.log(`${icon} ${t.method} ${t.path.padEnd(45)} → ${status} ${!pass ? `(expected ${t.expectStatus})` : ""}`);

        if (!pass) {
          apiBugs.push(`${t.method} ${t.path} → ${status} (expected ${t.expectStatus}): ${bodyPreview}`);
        }

        // Check for server errors even on "expected" codes
        if (status >= 500) {
          apiBugs.push(`🔴 SERVER ERROR: ${t.method} ${t.path} → ${status}: ${bodyPreview}`);
        }
      } catch (err: any) {
        console.log(`❌ ${t.method} ${t.path} → ERROR: ${err.message}`);
        apiBugs.push(`${t.method} ${t.path} → ERROR: ${err.message}`);
      }
    }

    // Edge case: POST with empty body
    console.log("\n--- Edge Cases: Empty/Invalid Bodies ---");
    const edgeCases = [
      { method: "POST", path: "/api/v1/sms/send", body: "{}", name: "SMS send empty" },
      { method: "POST", path: "/api/v1/contacts", body: "{}", name: "Contact create empty" },
      { method: "POST", path: "/api/v1/campaigns", body: "{}", name: "Campaign create empty" },
      { method: "POST", path: "/api/v1/sms/send", body: '{"to":"abc","message":"test"}', name: "SMS invalid phone" },
      { method: "POST", path: "/api/v1/contacts", body: '{"name":"<script>alert(1)</script>","phone":"0812345678"}', name: "Contact XSS name" },
    ];

    for (const t of edgeCases) {
      try {
        const resp = await page.request.fetch(`${BASE}${t.path}`, {
          method: t.method as any,
          headers: { "Content-Type": "application/json" },
          data: t.body,
        });
        const status = resp.status();
        const body = await resp.text().catch(() => "");

        // Should NOT be 500
        const icon = status < 500 ? "✅" : "🔴";
        console.log(`${icon} ${t.name.padEnd(30)} → ${status}: ${body.substring(0, 100)}`);

        if (status >= 500) {
          apiBugs.push(`🔴 ${t.name} → ${status}: ${body.substring(0, 200)}`);
        }
      } catch (err: any) {
        console.log(`❌ ${t.name} → ERROR: ${err.message}`);
      }
    }

    // Security: unauthenticated access
    console.log("\n--- Security: Unauthenticated Access ---");
    const unauthCtx = await browser.newContext();
    const unauthPage = await unauthCtx.newPage();

    const protectedApis = [
      "/api/v1/contacts",
      "/api/v1/sms/send",
      "/api/v1/campaigns",
      "/api/v1/api-keys",
      "/api/v1/settings/profile",
      "/api/auth/me",
    ];

    for (const path of protectedApis) {
      try {
        const resp = await unauthPage.request.fetch(`${BASE}${path}`, { method: "GET" });
        const status = resp.status();
        const icon = status === 401 || status === 403 ? "✅" : "🔴";
        console.log(`${icon} GET ${path.padEnd(40)} → ${status} (unauth)`);

        if (status === 200) {
          apiBugs.push(`🔴 SECURITY: ${path} accessible without auth (${status})`);
        }
      } catch (err: any) {
        console.log(`❌ ${path} → ERROR: ${err.message}`);
      }
    }

    await unauthCtx.close();

    console.log("\n" + "=".repeat(80));
    console.log(`API BUGS: ${apiBugs.length}`);
    for (const b of apiBugs) console.log(`  ${b}`);
    console.log("=".repeat(80));

    await ctx.close();
  });
});

// ===================== INTERACTIVE FLOW TESTS =====================
test.describe("Layer 2 — Interactive Flow Tests", () => {

  test("Send SMS form interaction", async ({ browser }) => {
    const ctx = await login(browser);
    const page = await ctx.newPage();

    // Try both possible SMS URLs
    let smsUrl = "/dashboard/send-sms";
    await page.goto(`${BASE}${smsUrl}`);
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);

    let bodyText = await page.locator("body").textContent().catch(() => "") || "";
    if (bodyText.includes("404") || bodyText.includes("ไม่พบ")) {
      smsUrl = "/dashboard/send";
      await page.goto(`${BASE}${smsUrl}`);
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      bodyText = await page.locator("body").textContent().catch(() => "") || "";
    }

    await snap(page, "flow-send-sms");
    console.log(`SMS page URL: ${smsUrl}`);
    console.log(`SMS page content (200): ${bodyText?.substring(0, 200)}`);

    // Try to interact with SMS form
    const allInputs = await page.locator("input, textarea, select").count();
    console.log(`SMS form inputs found: ${allInputs}`);

    // Fill recipient
    const recipientField = page.locator('input[name="to"], input[name="phone"], input[name="recipient"], textarea[name="recipients"], input[placeholder*="เบอร์"], input[placeholder*="หมายเลข"]').first();
    if (await recipientField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await recipientField.fill("0812345678");
      console.log("✅ Recipient field filled");
    } else {
      console.log("❌ No recipient field found");
    }

    // Fill message
    const msgField = page.locator('textarea[name="message"], textarea[placeholder*="ข้อความ"], textarea').first();
    if (await msgField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await msgField.fill("ทดสอบ Feature Freeze QA Scan");
      console.log("✅ Message field filled");
    } else {
      console.log("❌ No message textarea found");
    }

    await snap(page, "flow-send-sms-filled");
    await ctx.close();
  });

  test("Contacts CRUD flow", async ({ browser }) => {
    const ctx = await login(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "flow-contacts-list");

    // Find and click add button
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), a:has-text("เพิ่ม"), button:has-text("Add"), [data-testid*="add"], [data-testid*="create"]').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await snap(page, "flow-contacts-add-form");
      console.log("✅ Add contact form opened");
    } else {
      console.log("⚠️ No add contact button found — checking page content");
      const text = await page.locator("body").textContent().catch(() => "");
      console.log(`Page content (200): ${text?.substring(0, 200)}`);
    }

    await ctx.close();
  });

  test("Settings profile save", async ({ browser }) => {
    const ctx = await login(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "flow-settings");

    // Find name input
    const nameInput = page.locator('input[name="name"], input[name="displayName"], input[name="companyName"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const oldVal = await nameInput.inputValue();
      console.log(`Current name: ${oldVal}`);

      // Try saving
      const saveBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save"), button[type="submit"]').first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        await snap(page, "flow-settings-saved");
        console.log("✅ Settings save clicked");
      }
    } else {
      console.log("⚠️ No name input on settings page");
    }

    await ctx.close();
  });

  test("Support ticket creation flow", async ({ browser }) => {
    const ctx = await login(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/support/new`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "flow-support-new");

    const bodyText = await page.locator("body").textContent().catch(() => "") || "";
    console.log(`Support new page (200): ${bodyText?.substring(0, 200)}`);

    // Fill ticket form
    const subjectInput = page.locator('input[name="subject"], input[name="title"], input[placeholder*="หัวข้อ"], input[placeholder*="เรื่อง"]').first();
    if (await subjectInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subjectInput.fill("QA Freeze Test Ticket");
      console.log("✅ Subject filled");
    }

    const descInput = page.locator('textarea[name="description"], textarea[name="message"], textarea[name="content"], textarea').first();
    if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descInput.fill("This is a QA test ticket from Feature Freeze scan");
      console.log("✅ Description filled");
    }

    await snap(page, "flow-support-filled");
    await ctx.close();
  });

  test("Mobile responsive check — key pages", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await ctx.newPage();

    // Login on mobile
    await page.goto(`${BASE}/login`);
    await dismissCookies(page);
    await snap(page, "mobile-login");

    await page.locator('input[type="email"]').fill(QA_USER.email);
    await page.locator('input[type="password"]').fill(QA_USER.password);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(() => {});
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await snap(page, "mobile-dashboard");

    // Check horizontal overflow
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    console.log(`Mobile 375px overflow: ${overflow}`);

    // Check key pages
    const mobilePages = ["/dashboard/contacts", "/dashboard/history", "/dashboard/packages", "/dashboard/settings"];
    for (const p of mobilePages) {
      await page.goto(`${BASE}${p}`, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await snap(page, `mobile-${p.split("/").pop()}`);
      const mobileOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      if (mobileOverflow) console.log(`🔴 Mobile overflow on ${p}`);
    }

    await ctx.close();
  });
});
