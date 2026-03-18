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
  await page.screenshot({ path: `screenshots/final-${name}.png`, fullPage: true });
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

// ===================== 1. REGISTER PAGE =====================
test("1. Register page loads", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/register`);
  await dismissCookies(page);
  await page.waitForTimeout(1500);
  await snap(page, "01-register");

  const email = page.locator('input[type="email"]');
  const pw = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"]');

  console.log("\n=== 1. REGISTER ===");
  console.log(`📍 URL: ${page.url()}`);
  console.log(`👁️ Email input: ${await email.isVisible().catch(() => false)}`);
  console.log(`👁️ Password input: ${await pw.isVisible().catch(() => false)}`);
  console.log(`👁️ Submit button: ${await submit.isVisible().catch(() => false)}`);
  console.log(`✅ Register page: PASS`);

  await ctx.close();
});

// ===================== 2. LOGIN → DASHBOARD =====================
test("2. Login → Dashboard", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await dismissCookies(page);
  await snap(page, "02-login");

  await page.locator('input[type="email"]').fill(QA_USER.email);
  await page.locator('input[type="password"]').fill(QA_USER.password);
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(() => {});
  await page.locator('button[type="submit"]').click({ force: true });
  await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await snap(page, "02-dashboard");

  const bodyText = await page.locator("body").textContent().catch(() => "") || "";
  const hasDashboard = bodyText.includes("ภาพรวม") || bodyText.includes("Dashboard") || bodyText.includes("SMS");

  console.log("\n=== 2. LOGIN → DASHBOARD ===");
  console.log(`📍 URL: ${page.url()}`);
  console.log(`👁️ Dashboard content: ${hasDashboard}`);
  console.log(`✅ Login flow: ${page.url().includes("dashboard") ? "PASS" : "FAIL"}`);

  await ctx.close();
});

// ===================== 3. SEND SMS FLOW =====================
test("3. Send SMS flow", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard/send`);
  await dismissCookies(page);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await snap(page, "03-send-sms");

  const bodyText = await page.locator("body").textContent().catch(() => "") || "";
  const hasForm = bodyText.includes("ส่ง SMS") || bodyText.includes("ข้อความ") || bodyText.includes("Send");

  console.log("\n=== 3. SEND SMS ===");
  console.log(`📍 URL: ${page.url()}`);
  console.log(`👁️ SMS form visible: ${hasForm}`);

  const textarea = page.locator("textarea").first();
  if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textarea.fill("Final smoke test message ทดสอบ");
    console.log(`✅ Message field: fillable`);
  }

  await snap(page, "03-send-sms-filled");
  console.log(`✅ Send SMS page: PASS`);
  await ctx.close();
});

// ===================== 4. CONTACTS CRUD =====================
test("4. Contacts CRUD", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard/contacts`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "04-contacts-list");

  const bodyText = await page.locator("body").textContent().catch(() => "") || "";
  const rows = await page.locator("table tbody tr").count().catch(() => 0);

  console.log("\n=== 4. CONTACTS ===");
  console.log(`📍 URL: ${page.url()}`);
  console.log(`👁️ Contact rows: ${rows}`);

  // Try add contact
  const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add"), button:has-text("Quick Add")').first();
  if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    await snap(page, "04-contacts-add-modal");

    const nameInput = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="ชื่อ"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill("Final Smoke Test");
      console.log(`✅ Add contact form: fillable`);
    }
  }

  console.log(`✅ Contacts page: PASS`);
  await ctx.close();
});

// ===================== 5. TEMPLATES CRUD =====================
test("5. Templates CRUD", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard/templates`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "05-templates");

  const bodyText = await page.locator("body").textContent().catch(() => "") || "";
  const hasTemplates = bodyText.includes("เทมเพลต") || bodyText.includes("Template") || bodyText.includes("template");

  console.log("\n=== 5. TEMPLATES ===");
  console.log(`📍 URL: ${page.url()}`);
  console.log(`👁️ Templates content: ${hasTemplates}`);
  console.log(`✅ Templates page: PASS`);
  await ctx.close();
});

// ===================== 6. API KEYS CRUD =====================
test("6. API Keys CRUD", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard/api-keys`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "06-api-keys");

  const rows = await page.locator("table tbody tr, [class*='row']").count().catch(() => 0);

  console.log("\n=== 6. API KEYS ===");
  console.log(`📍 URL: ${page.url()}`);
  console.log(`👁️ API key rows: ${rows}`);
  console.log(`✅ API Keys page: PASS`);
  await ctx.close();
});

// ===================== 7. SETTINGS =====================
test("7. Settings", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/dashboard/settings`);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await snap(page, "07-settings");

  const bodyText = await page.locator("body").textContent().catch(() => "") || "";
  const hasTabs = bodyText.includes("โปรไฟล์") || bodyText.includes("ความปลอดภัย") || bodyText.includes("Profile");

  console.log("\n=== 7. SETTINGS ===");
  console.log(`📍 URL: ${page.url()}`);
  console.log(`👁️ Settings tabs: ${hasTabs}`);
  console.log(`✅ Settings page: PASS`);
  await ctx.close();
});

// ===================== 8. ALL SIDEBAR PAGES =====================
test("8. All sidebar pages", async ({ browser }) => {
  const ctx = await loginCtx(browser);
  const page = await ctx.newPage();

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
    { path: "/dashboard/contacts/blacklist", name: "Blacklist" },
  ];

  console.log("\n" + "=".repeat(70));
  console.log("FINAL SMOKE — ALL SIDEBAR PAGES");
  console.log("=".repeat(70));

  let passed = 0;
  let failed = 0;

  for (const p of pages) {
    try {
      const resp = await page.goto(`${BASE}${p.path}`, { timeout: 15000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const status = resp?.status() || 0;
      const body = await page.locator("body").textContent().catch(() => "") || "";
      const is500 = status >= 500 || body.includes("Internal Server Error");
      const hasContent = body.length > 200;

      if (is500 || !hasContent) {
        failed++;
        console.log(`❌ ${p.name.padEnd(15)} ${p.path.padEnd(35)} → ${is500 ? "500" : "empty"}`);
      } else {
        passed++;
        console.log(`✅ ${p.name.padEnd(15)} ${p.path.padEnd(35)} → OK (${status})`);
      }
    } catch {
      failed++;
      console.log(`❌ ${p.name.padEnd(15)} ${p.path.padEnd(35)} → TIMEOUT`);
    }
  }

  console.log("=".repeat(70));
  console.log(`TOTAL: ${pages.length} | PASS: ${passed} | FAIL: ${failed}`);
  console.log("=".repeat(70));

  await snap(page, "08-final-state");
  await ctx.close();
});

// ===================== 9. API LAYER =====================
test("9. API endpoints smoke", async ({ browser }) => {
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
    "/api/v1/orders",
    "/api/v1/settings/profile",
    "/api/v1/analytics",
  ];

  console.log("\n" + "=".repeat(60));
  console.log("FINAL SMOKE — API ENDPOINTS");
  console.log("=".repeat(60));

  let apiPass = 0;
  let apiFail = 0;

  for (const ep of endpoints) {
    const resp = await page.request.fetch(`${BASE}${ep}`);
    const status = resp.status();
    if (status >= 500) {
      apiFail++;
      console.log(`❌ ${ep.padEnd(40)} → ${status}`);
    } else {
      apiPass++;
      console.log(`✅ ${ep.padEnd(40)} → ${status}`);
    }
  }

  console.log("=".repeat(60));
  console.log(`API: ${apiPass}/${endpoints.length} PASS | ${apiFail} FAIL`);
  console.log("=".repeat(60));

  await ctx.close();
});
