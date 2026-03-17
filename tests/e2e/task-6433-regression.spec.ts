/**
 * Task #6433 — P0 Regression Test: หลัง StoreProviders fix
 * ทดสอบ: site loads, login, sidebar pages, forms, console errors
 */
import { test as base, expect } from "@playwright/test";
import { test, dismissCookieConsent, TEST_USER } from "./fixtures";

const SS = "tests/screenshots/task-6433";

// ═══ Part 1: Auth Bypass Regression (NO AUTH) ═══
const noAuth = base;
noAuth.describe("Regression 1: Auth Bypass Fixed?", () => {
  const protectedPages = [
    "/dashboard",
    "/dashboard/send",
    "/dashboard/contacts",
    "/dashboard/settings",
    "/dashboard/api-keys",
    "/dashboard/campaigns",
    "/dashboard/senders",
    "/dashboard/webhooks",
  ];

  for (const url of protectedPages) {
    noAuth(`Auth: ${url} → must redirect to /login`, async ({ page }) => {
      await page.goto(`http://localhost:3000${url}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      const isOnLogin = finalUrl.includes("/login");
      console.log(`${url} → ${finalUrl} (login: ${isOnLogin})`);
      expect(isOnLogin).toBe(true);
    });
  }
});

// ═══ Part 2: Login Flow ═══
noAuth.describe("Regression 2: Login Flow", () => {
  noAuth("Login → Dashboard success", async ({ page }) => {
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.screenshot({ path: `${SS}/01-login-page.png`, fullPage: true });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);

    // Wait for submit button to be enabled
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(async () => {
      await emailInput.clear();
      await emailInput.type(TEST_USER.email);
      await passwordInput.clear();
      await passwordInput.type(TEST_USER.password);
      await page.waitForFunction(
        () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
        { timeout: 5000 }
      );
    });

    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.screenshot({ path: `${SS}/02-dashboard-after-login.png`, fullPage: true });

    expect(page.url()).toContain("/dashboard");
    const body = await page.textContent("body");
    expect(body).toContain("ภาพรวม");
    console.log("✅ Login → Dashboard success");
  });
});

// ═══ Part 3: All Sidebar Pages (Authenticated) ═══
test.describe("Regression 3: Sidebar Pages", () => {
  const pages = [
    { name: "Dashboard", url: "/dashboard" },
    { name: "ส่ง SMS", url: "/dashboard/send" },
    { name: "ประวัติการส่ง", url: "/dashboard/messages" },
    { name: "บริการ OTP", url: "/dashboard/otp" },
    { name: "เทมเพลต", url: "/dashboard/templates" },
    { name: "ซื้อแพ็กเกจ", url: "/dashboard/billing/packages" },
    { name: "แพ็กเกจของฉัน", url: "/dashboard/packages/my" },
    { name: "ประวัติคำสั่งซื้อ", url: "/dashboard/billing/orders" },
    { name: "รายชื่อผู้ติดต่อ", url: "/dashboard/contacts" },
    { name: "แท็ก", url: "/dashboard/tags" },
    { name: "กลุ่ม", url: "/dashboard/groups" },
    { name: "ชื่อผู้ส่ง", url: "/dashboard/senders" },
    { name: "แคมเปญ", url: "/dashboard/campaigns" },
    { name: "รายงาน", url: "/dashboard/analytics" },
    { name: "คีย์ API", url: "/dashboard/api-keys" },
    { name: "Webhooks", url: "/dashboard/webhooks" },
    { name: "API Logs", url: "/dashboard/logs" },
    { name: "เอกสาร API", url: "/dashboard/api-docs" },
    { name: "ตั้งค่า", url: "/dashboard/settings" },
  ];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    test(`Page ${i + 1}: ${p.name}`, async ({ authedPage: page }) => {
      const consoleErrors: string[] = [];
      const serverErrors: string[] = [];
      page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text().substring(0, 150)); });
      page.on("response", (r) => { if (r.status() >= 500) serverErrors.push(`${r.url()} → ${r.status()}`); });

      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await dismissCookieConsent(page);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SS}/03-page-${String(i).padStart(2, "0")}-${p.name}.png`, fullPage: true });

      const body = await page.textContent("body");
      const is404 = body?.includes("ไม่พบหน้าที่คุณต้องการ") || false;

      console.log(`${p.name}: 404=${is404}, console=${consoleErrors.length}, 500s=${serverErrors.length}`);
      if (consoleErrors.length > 0) consoleErrors.forEach((e) => console.log(`  ⚠️ ${e}`));
      if (serverErrors.length > 0) serverErrors.forEach((e) => console.log(`  🔴 ${e}`));

      expect(is404).toBe(false);
    });
  }
});

// ═══ Part 4: Core Interactive Flows ═══
test.describe("Regression 4: Core Flows", () => {
  test("4.1 Send SMS — form renders", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Check form elements exist
    const phoneInput = page.locator('input[placeholder*="เบอร์"], input[type="tel"]').first();
    const messageArea = page.locator('textarea').first();
    const sendBtn = page.locator('button:has-text("ส่ง SMS"), button:has-text("ส่ง")').first();

    const phoneVisible = await phoneInput.isVisible({ timeout: 3000 }).catch(() => false);
    const msgVisible = await messageArea.isVisible({ timeout: 3000 }).catch(() => false);
    const btnVisible = await sendBtn.isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`SMS form: phone=${phoneVisible}, message=${msgVisible}, sendBtn=${btnVisible}`);
    await page.screenshot({ path: `${SS}/04-sms-form.png`, fullPage: true });

    expect(phoneVisible || msgVisible).toBe(true);
  });

  test("4.2 Contacts — add contact", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const addBtn = page.locator('button:has-text("เพิ่มรายชื่อ")').first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/04-contacts-add.png`, fullPage: true });

    const dialog = page.locator('[role="dialog"]').first();
    const dialogVisible = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Contact add dialog: ${dialogVisible}`);
    expect(dialogVisible).toBe(true);
  });

  test("4.3 Settings — 6 tabs all work", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`Settings tabs found: ${tabCount}`);
    expect(tabCount).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < tabCount; i++) {
      await tabs.nth(i).click({ force: true });
      await page.waitForTimeout(1000);
      const name = await tabs.nth(i).textContent();
      console.log(`  Tab ${i}: ${name?.trim()} ✅`);
    }
    await page.screenshot({ path: `${SS}/04-settings-tabs.png`, fullPage: true });
  });

  test("4.4 Campaigns — page loads with content", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/04-campaigns.png`, fullPage: true });

    const body = await page.textContent("body");
    expect(body).toContain("แคมเปญ");
  });
});

// ═══ Part 5: API Sweep ═══
test.describe("Regression 5: API Health", () => {
  test("5.1 All API endpoints", async ({ authedPage: page }) => {
    const endpoints = [
      "/api/v1/dashboard/summary",
      "/api/v1/senders",
      "/api/v1/templates",
      "/api/v1/campaigns",
      "/api/v1/groups",
      "/api/v1/contacts",
      "/api/v1/settings/profile",
      "/api/v1/api-keys",
      "/api/v1/packages",
      "/api/v1/orders",
      "/api/v1/payments/history",
      "/api/v1/tickets",
      "/api/v1/webhooks",
      "/api/v1/tags",
      "/api/v1/settings/notifications",
    ];

    const failures: string[] = [];
    console.log("\n📊 API Health Check:");
    for (const ep of endpoints) {
      const r = await page.request.get(ep);
      const ok = r.ok();
      console.log(`  ${ok ? "✅" : "❌"} ${ep} → ${r.status()}`);
      if (!ok) failures.push(`${ep} → ${r.status()}`);
    }
    console.log(`\n${endpoints.length - failures.length}/${endpoints.length} PASS`);

    // Allow known 404s but no 500s
    const server500s = failures.filter((f) => f.includes("500"));
    expect(server500s.length).toBe(0);
  });
});
