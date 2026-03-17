/**
 * Task #6409 — P0 FULL BUG HUNT smsok-clone (localhost:3000)
 * Comprehensive test: every sidebar page, every form, every flow
 * Console errors tracked, screenshots every step
 */
import { test as base, expect } from "@playwright/test";
import { test, dismissCookieConsent, TEST_USER, loginAs } from "./fixtures";

const SS = "tests/screenshots/task-6409";

// ═══════════════════════════════════════════════════════════
// PART 1: API Layer — Sweep all endpoints
// ═══════════════════════════════════════════════════════════
test.describe("Part 1: API Sweep", () => {
  test("1.1 All API endpoints status check", async ({ authedPage: page }) => {
    const endpoints = [
      { method: "GET", path: "/api/v1/dashboard/summary" },
      { method: "GET", path: "/api/v1/senders" },
      { method: "GET", path: "/api/v1/templates" },
      { method: "GET", path: "/api/v1/campaigns" },
      { method: "GET", path: "/api/v1/groups" },
      { method: "GET", path: "/api/v1/contacts" },
      { method: "GET", path: "/api/v1/settings/profile" },
      { method: "GET", path: "/api/v1/api-keys" },
      { method: "GET", path: "/api/v1/packages" },
      { method: "GET", path: "/api/v1/orders" },
      { method: "GET", path: "/api/v1/payments/history" },
      { method: "GET", path: "/api/v1/tickets" },
      { method: "GET", path: "/api/v1/activity" },
      { method: "GET", path: "/api/v1/sms/history" },
      { method: "GET", path: "/api/v1/webhooks" },
      { method: "GET", path: "/api/v1/tags" },
      { method: "GET", path: "/api/v1/settings/notifications" },
    ];

    const results: { path: string; status: number; ok: boolean }[] = [];
    for (const ep of endpoints) {
      const r = await page.request.get(ep.path);
      results.push({ path: ep.path, status: r.status(), ok: r.ok() });
    }

    console.log("\n📊 API Sweep:");
    const failures: string[] = [];
    for (const r of results) {
      const icon = r.ok ? "✅" : "❌";
      console.log(`  ${icon} ${r.path} → ${r.status}`);
      if (!r.ok) failures.push(`${r.path} → ${r.status}`);
    }
    console.log(`\n${results.length - failures.length} PASS / ${failures.length} FAIL`);

    if (failures.length > 0) {
      console.log("\n🐛 FAILING ENDPOINTS:");
      failures.forEach((f) => console.log(`  ❌ ${f}`));
    }
    // Don't fail the test — just report
  });
});

// ═══════════════════════════════════════════════════════════
// PART 2: Browser — Every sidebar page + console errors
// ═══════════════════════════════════════════════════════════
test.describe("Part 2: All Sidebar Pages", () => {
  test("2.1 Dashboard loads with KPI cards", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`500: ${r.url()}`); });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/01-dashboard.png`, fullPage: true });

    const body = await page.textContent("body");
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");
    console.log(`Dashboard console errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  ⚠️ ${e.substring(0, 200)}`));
  });

  const sidebarPages = [
    { name: "ส่ง SMS", url: "/dashboard/send", keyword: "ส่ง SMS" },
    { name: "ประวัติการส่ง", url: "/dashboard/messages", keyword: "ประวัติ" },
    { name: "บริการ OTP", url: "/dashboard/otp", keyword: "OTP" },
    { name: "เทมเพลต", url: "/dashboard/templates", keyword: "เทมเพลต" },
    { name: "ซื้อแพ็กเกจ", url: "/dashboard/billing/packages", keyword: "แพ็กเกจ" },
    { name: "แพ็กเกจของฉัน", url: "/dashboard/packages/my", keyword: "แพ็กเกจ" },
    { name: "ประวัติคำสั่งซื้อ", url: "/dashboard/billing/orders", keyword: "คำสั่งซื้อ" },
    { name: "รายชื่อผู้ติดต่อ", url: "/dashboard/contacts", keyword: "ผู้ติดต่อ" },
    { name: "แท็ก", url: "/dashboard/tags", keyword: "แท็ก" },
    { name: "กลุ่ม", url: "/dashboard/groups", keyword: "กลุ่ม" },
    { name: "ชื่อผู้ส่ง", url: "/dashboard/senders", keyword: "ผู้ส่ง" },
    { name: "แคมเปญ", url: "/dashboard/campaigns", keyword: "แคมเปญ" },
    { name: "รายงาน", url: "/dashboard/analytics", keyword: "รายงาน" },
    { name: "คีย์ API", url: "/dashboard/api-keys", keyword: "API" },
    { name: "Webhooks", url: "/dashboard/webhooks", keyword: "Webhook" },
    { name: "API Logs", url: "/dashboard/logs", keyword: "Log" },
    { name: "เอกสาร API", url: "/dashboard/api-docs", keyword: "API" },
    { name: "ตั้งค่า", url: "/dashboard/settings", keyword: "ตั้งค่า" },
  ];

  for (let i = 0; i < sidebarPages.length; i++) {
    const p = sidebarPages[i];
    test(`2.${i + 2} ${p.name} (${p.url})`, async ({ authedPage: page }) => {
      const errors: string[] = [];
      const serverErrors: string[] = [];
      page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
      page.on("response", (r) => { if (r.status() >= 500) serverErrors.push(`${r.url()} → ${r.status()}`); });

      await page.goto(p.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await dismissCookieConsent(page);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SS}/02-${String(i).padStart(2, "0")}-${p.name}.png`, fullPage: true });

      const body = await page.textContent("body");

      // Check not 404
      const is404 = body?.includes("ไม่พบหน้าที่คุณต้องการ") || false;
      console.log(`${p.name}: 404=${is404}, console_errors=${errors.length}, server_500=${serverErrors.length}`);
      if (errors.length > 0) errors.forEach((e) => console.log(`  ⚠️ console: ${e.substring(0, 150)}`));
      if (serverErrors.length > 0) serverErrors.forEach((e) => console.log(`  🔴 500: ${e}`));

      expect(is404).toBe(false);
    });
  }
});

// ═══════════════════════════════════════════════════════════
// PART 3: Core Flows — Interactive tests
// ═══════════════════════════════════════════════════════════
test.describe("Part 3: Core Flows", () => {
  test("3.1 Send SMS — fill form and check validation", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.url()} → ${r.status()}`); });

    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-sms-form-initial.png`, fullPage: true });

    // Find phone input
    const phoneInput = page.locator('input[placeholder*="เบอร์"], input[name*="phone"], input[type="tel"]').first();
    const phoneVisible = await phoneInput.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Phone input visible: ${phoneVisible}`);

    if (phoneVisible) {
      await phoneInput.fill("0891234567");

      // Find message textarea
      const messageInput = page.locator('textarea, [contenteditable="true"]').first();
      const msgVisible = await messageInput.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`Message input visible: ${msgVisible}`);

      if (msgVisible) {
        await messageInput.fill("QA Bug Hunt Test Message — ทดสอบส่ง SMS จาก QA");
        await page.screenshot({ path: `${SS}/03-sms-form-filled.png`, fullPage: true });
      }

      // Try submit (expect validation or credit error, not crash)
      const sendBtn = page.locator('button:has-text("ส่ง"), button:has-text("Send")').first();
      if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendBtn.click({ force: true });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SS}/03-sms-after-send.png`, fullPage: true });

        const bodyAfter = await page.textContent("body");
        console.log(`After send - has error toast: ${bodyAfter?.includes("ข้อผิดพลาด") || bodyAfter?.includes("เครดิตไม่พอ") || bodyAfter?.includes("ผู้ส่ง")}`);
      }
    }

    console.log(`SMS page 500 errors: ${errors.length}`);
  });

  test("3.2 Contacts — CRUD flow", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.url()} → ${r.status()}`); });

    await page.goto("/dashboard/contacts", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-contacts-list.png`, fullPage: true });

    // Add contact
    const addBtn = page.locator('button:has-text("เพิ่มรายชื่อ"), a:has-text("เพิ่มรายชื่อ")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/03-contacts-add-modal.png`, fullPage: true });

      // Fill form in dialog
      const dialog = page.locator('[role="dialog"], .modal').first();
      const nameInput = dialog.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
      const phoneInput = dialog.locator('input[name="phone"], input[placeholder*="เบอร์"], input[type="tel"]').first();

      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const ts = Date.now();
        await nameInput.fill(`BugHunt Contact ${ts}`);
        if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await phoneInput.fill(`089${String(ts).slice(-7)}`);
        }
        await page.screenshot({ path: `${SS}/03-contacts-form-filled.png`, fullPage: true });

        // Submit
        const submitBtn = dialog.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("เพิ่ม")').first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click({ force: true });
          await page.waitForTimeout(3000);
          await page.screenshot({ path: `${SS}/03-contacts-after-add.png`, fullPage: true });
        }
      }
    }

    console.log(`Contacts 500 errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  🔴 ${e}`));
  });

  test("3.3 Packages — view tiers and buy flow", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.url()} → ${r.status()}`); });

    await page.goto("/dashboard/billing/packages", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-packages.png`, fullPage: true });

    // Check package cards exist
    const buyBtns = page.locator('button:has-text("ซื้อ"), button:has-text("เลือก"), button:has-text("สั่งซื้อ")');
    const buyCount = await buyBtns.count();
    console.log(`Package buy buttons: ${buyCount}`);

    // Click first buy button to check flow
    if (buyCount > 0) {
      await buyBtns.first().click({ force: true });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SS}/03-packages-buy-flow.png`, fullPage: true });
    }

    console.log(`Packages 500 errors: ${errors.length}`);
  });

  test("3.4 Settings — all tabs clickable", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.url()} → ${r.status()}`); });

    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    console.log(`Settings tabs: ${tabCount}`);

    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const tabName = await tab.textContent();
      await tab.click({ force: true });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SS}/03-settings-tab-${i}-${tabName?.trim()}.png`, fullPage: true });
      console.log(`  Tab ${i}: ${tabName?.trim()} ✅`);
    }

    console.log(`Settings 500 errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  🔴 ${e}`));
  });

  test("3.5 Campaigns — create flow", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.url()} → ${r.status()}`); });

    await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-campaigns.png`, fullPage: true });

    // Click create
    const createBtn = page.locator('button:has-text("สร้าง"), a:has-text("สร้าง")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/03-campaigns-create.png`, fullPage: true });
    }

    console.log(`Campaigns 500 errors: ${errors.length}`);
  });

  test("3.6 Senders — page loads and add sender", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.url()} → ${r.status()}`); });

    await page.goto("/dashboard/senders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-senders.png`, fullPage: true });

    const addBtn = page.locator('button:has-text("เพิ่ม"), a:has-text("เพิ่ม")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/03-senders-add.png`, fullPage: true });
    }

    const body = await page.textContent("body");
    const hasError = body?.includes("ไม่สามารถโหลด") || body?.includes("Error");
    console.log(`Senders page error: ${hasError}`);
    console.log(`Senders 500 errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  🔴 ${e}`));
  });

  test("3.7 API Keys — create key flow", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.url()} → ${r.status()}`); });

    await page.goto("/dashboard/api-keys", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-apikeys.png`, fullPage: true });

    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("Create")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/03-apikeys-create.png`, fullPage: true });
    }

    console.log(`API Keys 500 errors: ${errors.length}`);
  });
});

// ═══════════════════════════════════════════════════════════
// PART 4: Edge Cases & Security
// ═══════════════════════════════════════════════════════════
test.describe("Part 4: Edge Cases", () => {
  test("4.1 XSS in profile name", async ({ authedPage: page }) => {
    const r = await page.request.put("/api/v1/settings/profile", {
      data: { name: '<script>alert("xss")</script>' },
    });
    console.log(`XSS profile update: ${r.status()}`);

    if (r.ok()) {
      await page.goto("/dashboard/settings", { waitUntil: "networkidle" });
      const body = await page.textContent("body");
      const hasRawScript = body?.includes('<script>alert');
      console.log(`Raw XSS in page: ${hasRawScript}`);
      expect(hasRawScript).toBe(false);

      // Restore name
      await page.request.put("/api/v1/settings/profile", {
        data: { name: "QA Test User Updated" },
      });
    }
  });

  test("4.2 Empty body to critical endpoints", async ({ authedPage: page }) => {
    const endpoints = [
      { method: "POST", path: "/api/v1/sms/send" },
      { method: "POST", path: "/api/v1/contacts" },
      { method: "POST", path: "/api/v1/templates" },
      { method: "POST", path: "/api/v1/campaigns" },
    ];

    for (const ep of endpoints) {
      const r = await page.request.post(ep.path, { data: {} });
      const is500 = r.status() >= 500;
      console.log(`Empty POST ${ep.path} → ${r.status()} ${is500 ? "🔴 SERVER ERROR" : "✅"}`);
      if (is500) {
        const body = await r.text();
        console.log(`  Response: ${body.substring(0, 200)}`);
      }
    }
  });

  test("4.3 SQL injection in search", async ({ authedPage: page }) => {
    const r = await page.request.get("/api/v1/contacts?search=' OR 1=1--");
    console.log(`SQL injection contacts: ${r.status()}`);
    expect(r.status()).not.toBe(500);
  });

  test("4.4 Double-submit contact creation", async ({ authedPage: page }) => {
    const ts = Date.now();
    const data = { name: `DoubleSubmit ${ts}`, phone: `089${String(ts).slice(-7)}` };

    const [r1, r2] = await Promise.all([
      page.request.post("/api/v1/contacts", { data }),
      page.request.post("/api/v1/contacts", { data }),
    ]);

    console.log(`Double submit: ${r1.status()} / ${r2.status()}`);
    // At least one should succeed, ideally second rejects duplicate
    const bothCreated = r1.status() === 201 && r2.status() === 201;
    if (bothCreated) {
      console.log("⚠️ Both requests created — no duplicate protection!");
    }
  });
});

// ═══════════════════════════════════════════════════════════
// PART 5: Auth bypass (no auth)
// ═══════════════════════════════════════════════════════════
const noAuth = base;
noAuth.describe("Part 5: Auth Bypass Check", () => {
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
    noAuth(`5.x No-auth access: ${url}`, async ({ page }) => {
      await page.goto(`http://localhost:3000${url}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      const body = await page.textContent("body");
      const isOnLogin = finalUrl.includes("/login");
      const showsDashContent = body?.includes("ภาพรวม") || body?.includes("ส่ง SMS") || false;

      console.log(`${url} → redirected to login: ${isOnLogin}, shows dash content: ${showsDashContent}`);

      if (!isOnLogin && showsDashContent) {
        console.log(`🔴 CRITICAL AUTH BYPASS: ${url} accessible without login!`);
      }

      expect(isOnLogin).toBe(true);
    });
  }
});
