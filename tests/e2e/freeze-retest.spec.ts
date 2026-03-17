import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_USER = { email: "qa-suite@smsok.test", password: "QATest123!" };

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
  await page.screenshot({ path: `screenshots/retest-${name}.png`, fullPage: true });
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

// ===================== RETEST: PRISMA BUG FIX =====================
test("RETEST BUG-FF01: Prisma sender_type column", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  const prismaErrors: string[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("Prisma") || text.includes("prisma")) {
      prismaErrors.push(text.substring(0, 300));
    }
  });

  // Dashboard — where the error occurred
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await snap(page, "prisma-dashboard");

  // Senders page — directly uses getSenderNames()
  await page.goto(`${BASE}/dashboard/senders`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await snap(page, "prisma-senders");

  // Send SMS — also uses senders
  await page.goto(`${BASE}/dashboard/send`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await snap(page, "prisma-send-sms");

  // API check
  const sendersResp = await page.request.fetch(`${BASE}/api/v1/senders`);
  const sendersStatus = sendersResp.status();
  const sendersBody = await sendersResp.text().catch(() => "");
  const sendersPrismaErr = sendersBody.includes("sender_type") || sendersBody.includes("Prisma");

  console.log("\n=== RETEST BUG-FF01: Prisma sender_type ===");
  console.log(`Console Prisma errors: ${prismaErrors.length}`);
  for (const e of prismaErrors) console.log(`  🔴 ${e.substring(0, 200)}`);
  console.log(`API /api/v1/senders: ${sendersStatus} prismaErr=${sendersPrismaErr}`);
  console.log(`Result: ${prismaErrors.length === 0 && !sendersPrismaErr ? "✅ FIXED" : "❌ STILL BROKEN"}`);

  await ctx.close();
});

// ===================== FULL REGRESSION: ALL CORE FLOWS =====================
test("REGRESSION: All core flows", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  const consoleErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("hydrat") && !msg.text().includes("HMR")) {
      consoleErrors.push(msg.text().substring(0, 200));
    }
  });

  const pages = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/dashboard/send", name: "Send SMS" },
    { path: "/dashboard/history", name: "History" },
    { path: "/dashboard/otp", name: "OTP" },
    { path: "/dashboard/templates", name: "Templates" },
    { path: "/dashboard/contacts", name: "Contacts" },
    { path: "/dashboard/groups", name: "Groups" },
    { path: "/dashboard/tags", name: "Tags" },
    { path: "/dashboard/senders", name: "Senders" },
    { path: "/dashboard/campaigns", name: "Campaigns" },
    { path: "/dashboard/packages", name: "Packages" },
    { path: "/dashboard/packages/my", name: "My Packages" },
    { path: "/dashboard/orders", name: "Orders" },
    { path: "/dashboard/api-keys", name: "API Keys" },
    { path: "/dashboard/webhooks", name: "Webhooks" },
    { path: "/dashboard/settings", name: "Settings" },
    { path: "/dashboard/support", name: "Support" },
    { path: "/dashboard/analytics", name: "Analytics" },
    { path: "/dashboard/reports", name: "Reports" },
  ];

  console.log("\n" + "=".repeat(80));
  console.log("FEATURE FREEZE RETEST — ALL CORE FLOWS");
  console.log("=".repeat(80));

  let passed = 0;
  let failed = 0;

  for (const p of pages) {
    try {
      const resp = await page.goto(`${BASE}${p.path}`, { timeout: 15000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const status = resp?.status() || 0;
      const url = page.url();
      const bodyText = await page.locator("body").textContent().catch(() => "") || "";
      const is404 = bodyText.includes("ไม่พบหน้า") && bodyText.includes("404");
      const is500 = status >= 500 || bodyText.includes("Internal Server Error");
      const hasContent = bodyText.length > 200;

      if (is404 || is500 || !hasContent) {
        failed++;
        const reason = is404 ? "404" : is500 ? "500" : "empty";
        console.log(`❌ ${p.name.padEnd(20)} ${p.path.padEnd(35)} → ${reason}`);
        await snap(page, `fail-${p.name.toLowerCase().replace(/\s/g, "-")}`);
      } else {
        passed++;
        console.log(`✅ ${p.name.padEnd(20)} ${p.path.padEnd(35)} → OK (${status})`);
      }
    } catch (err: any) {
      failed++;
      console.log(`❌ ${p.name.padEnd(20)} ${p.path.padEnd(35)} → TIMEOUT`);
    }
  }

  console.log("=".repeat(80));
  console.log(`TOTAL: ${pages.length} | PASS: ${passed} | FAIL: ${failed}`);

  if (consoleErrors.length > 0) {
    console.log(`\nConsole errors (${consoleErrors.length}):`);
    const unique = [...new Set(consoleErrors)].slice(0, 10);
    for (const e of unique) console.log(`  ⚠️ ${e.substring(0, 150)}`);
  }

  console.log("=".repeat(80));
  await snap(page, "final-state");
  await ctx.close();
});

// ===================== LAYER 1: API SMOKE =====================
test("LAYER 1: API endpoints regression", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState("domcontentloaded").catch(() => {});

  const endpoints = [
    "/api/health",
    "/api/auth/me",
    "/api/v1/dashboard/summary",
    "/api/v1/senders",
    "/api/v1/contacts",
    "/api/v1/packages",
    "/api/v1/sms/history",
    "/api/v1/campaigns",
    "/api/v1/api-keys",
    "/api/v1/templates",
    "/api/v1/tickets",
    "/api/v1/webhooks",
    "/api/v1/groups",
    "/api/v1/tags",
    "/api/v1/credits/balance",
    "/api/v1/invoices",
    "/api/v1/orders",
    "/api/v1/settings/profile",
    "/api/v1/logs",
    "/api/v1/analytics",
  ];

  console.log("\n" + "=".repeat(60));
  console.log("LAYER 1 — API REGRESSION");
  console.log("=".repeat(60));

  let apiPass = 0;
  let apiFail = 0;

  for (const ep of endpoints) {
    try {
      const resp = await page.request.fetch(`${BASE}${ep}`);
      const status = resp.status();
      const body = await resp.text().catch(() => "");
      const has500 = status >= 500;
      const hasPrisma = body.includes("Prisma") || body.includes("prisma");

      if (has500 || hasPrisma) {
        apiFail++;
        console.log(`❌ ${ep.padEnd(40)} → ${status} ${hasPrisma ? "PRISMA ERROR" : ""}`);
      } else {
        apiPass++;
        console.log(`✅ ${ep.padEnd(40)} → ${status}`);
      }
    } catch {
      apiFail++;
      console.log(`❌ ${ep.padEnd(40)} → ERROR`);
    }
  }

  console.log("=".repeat(60));
  console.log(`API: ${apiPass}/${endpoints.length} PASS | ${apiFail} FAIL`);
  console.log("=".repeat(60));

  await ctx.close();
});

// ===================== INTERACTIVE FLOWS =====================
test("LAYER 2: Interactive flows — SMS, Contacts, Settings", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();

  console.log("\n=== INTERACTIVE FLOW TESTS ===");

  // SMS Send page
  await page.goto(`${BASE}/dashboard/send`);
  await dismissCookies(page);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await snap(page, "interactive-sms");

  const smsText = await page.locator("body").textContent().catch(() => "") || "";
  const smsHasForm = smsText.includes("ส่ง SMS") || smsText.includes("ข้อความ");
  console.log(`✅ SMS Send page: ${smsHasForm ? "form visible" : "⚠️ form not found"}`);

  // Fill message
  const msgField = page.locator("textarea").first();
  if (await msgField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await msgField.fill("Feature Freeze retest message");
    console.log("✅ SMS message field: fillable");
  }

  // Contacts
  await page.goto(`${BASE}/dashboard/contacts`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "interactive-contacts");

  const contactCount = await page.locator("table tbody tr, [class*='row']").count().catch(() => 0);
  console.log(`✅ Contacts: ${contactCount} rows visible`);

  // Settings
  await page.goto(`${BASE}/dashboard/settings`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "interactive-settings");

  const settingsText = await page.locator("body").textContent().catch(() => "") || "";
  const hasTabs = settingsText.includes("โปรไฟล์") || settingsText.includes("ความปลอดภัย") || settingsText.includes("API Keys");
  console.log(`✅ Settings: ${hasTabs ? "tabs visible" : "⚠️ tabs not found"}`);

  // Campaigns
  await page.goto(`${BASE}/dashboard/campaigns`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "interactive-campaigns");

  const campaignsText = await page.locator("body").textContent().catch(() => "") || "";
  const hasCampaigns = campaignsText.includes("แคมเปญ") || campaignsText.includes("Campaign");
  console.log(`✅ Campaigns: ${hasCampaigns ? "page loaded" : "⚠️ not loaded"}`);

  // Packages
  await page.goto(`${BASE}/dashboard/packages`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "interactive-packages");

  const pkgText = await page.locator("body").textContent().catch(() => "") || "";
  const hasPkgs = pkgText.includes("Starter") || pkgText.includes("Growth") || pkgText.includes("แพ็กเกจ");
  console.log(`✅ Packages: ${hasPkgs ? "tiers visible" : "⚠️ not visible"}`);

  console.log("=== INTERACTIVE FLOWS DONE ===\n");

  await ctx.close();
});
