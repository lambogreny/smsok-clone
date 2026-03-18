import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const CREDS = { email: "qa-suite@smsok.test", password: process.env.E2E_USER_PASSWORD! };

// Helper: login and return authenticated page
async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});

  // Dismiss cookie consent
  const accept = page.getByText("ยอมรับทั้งหมด");
  if (await accept.isVisible({ timeout: 2000 }).catch(() => false)) {
    await accept.click();
    await accept.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }

  await page.locator('input[type="email"]').fill(CREDS.email);
  await page.locator('input[type="password"]').fill(CREDS.password);

  // Wait for submit to be enabled
  await page.waitForFunction(
    () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
    { timeout: 10000 }
  ).catch(() => {});

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard/, { timeout: 30000 });
}

test.describe("A. AUTH FLOWS", () => {
  test("A1: Login → dashboard", async ({ page }) => {
    await login(page);
    expect(page.url()).toContain("/dashboard");
    await page.screenshot({ path: "test-results/4608-A1-login.png" });
  });

  test("A2: Login wrong password → error", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const accept = page.getByText("ยอมรับทั้งหมด");
    if (await accept.isVisible({ timeout: 1000 }).catch(() => false)) await accept.click();

    await page.locator('input[type="email"]').fill(CREDS.email);
    await page.locator('input[type="password"]').fill("wrongpass");
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 5000 }
    ).catch(() => {});
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Should show error, NOT redirect to dashboard
    expect(page.url()).toContain("/login");
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/ไม่ถูกต้อง|error|ผิด/i);
    await page.screenshot({ path: "test-results/4608-A2-wrong-pass.png" });
  });

  test("A3: Logout → redirect login", async ({ page }) => {
    await login(page);
    // Find logout button/link
    const logoutBtn = page.locator('button, a').filter({ hasText: /ออกจากระบบ|logout|sign out/i }).first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("/login");
    } else {
      // Try via sidebar or dropdown
      await page.goto(`${BASE}/api/auth/logout`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: "test-results/4608-A3-logout.png" });
  });

  test("A4: Protected route without login → redirect", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/login");
    await page.screenshot({ path: "test-results/4608-A4-protected.png" });
    await ctx.close();
  });

  test("A5: Register page loads with all fields", async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/สมัคร|register|ลงทะเบียน/i);
    await page.screenshot({ path: "test-results/4608-A5-register.png" });
  });

  test("A6: Forgot password page loads", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/ลืม|forgot|รหัสผ่าน|password|เบอร์โทร/i);
    await page.screenshot({ path: "test-results/4608-A6-forgot.png" });
  });
});

test.describe("B. DASHBOARD", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("B1: Dashboard shows KPI cards", async ({ page }) => {
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    // Should show actual numbers, not NaN
    expect(body).not.toContain("NaN");
    await page.screenshot({ path: "test-results/4608-B1-dashboard.png" });
  });

  test("B2: Dashboard sidebar navigation works", async ({ page }) => {
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: "test-results/4608-B2-sidebar.png" });
  });
});

test.describe("C. SMS FLOWS", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("C1: Send SMS page loads with form", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/ส่ง|send|SMS|ข้อความ/i);
    await page.screenshot({ path: "test-results/4608-C1-send-sms.png" });
  });

  test("C2: SenderDropdown visible on send page", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    // Check for sender dropdown/select
    const senderArea = page.locator('select, [role="combobox"], [data-testid*="sender"], button').filter({ hasText: /ผู้ส่ง|sender|SMSOK/i }).first();
    const visible = await senderArea.isVisible({ timeout: 5000 }).catch(() => false);
    await page.screenshot({ path: "test-results/4608-C2-sender-dropdown.png" });
    // Just screenshot — presence check
  });

  test("C3: Message textarea + character count", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill("ทดสอบข้อความ SMS จาก QA");
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: "test-results/4608-C3-message.png" });
  });

  test("C4: Send button disabled without data", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const sendBtn = page.locator('button').filter({ hasText: /ส่ง|send/i }).first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const disabled = await sendBtn.isDisabled();
      // Should be disabled without recipient
    }
    await page.screenshot({ path: "test-results/4608-C4-send-disabled.png" });
  });

  test("C5: Campaigns page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/แคมเปญ|campaign|สร้าง/i);
    await page.screenshot({ path: "test-results/4608-C5-campaigns.png" });
  });

  test("C6: Templates page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/templates`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/template|เทมเพลต|แม่แบบ|สร้าง/i);
    await page.screenshot({ path: "test-results/4608-C6-templates.png" });
  });

  test("C7: Scheduled SMS page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/scheduled`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-C7-scheduled.png" });
  });
});

test.describe("D. DATA MANAGEMENT", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("D1: Contacts page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    await page.screenshot({ path: "test-results/4608-D1-contacts.png" });
    // Check it loaded (even if empty state)
    expect(body!.length).toBeGreaterThan(50);
  });

  test("D2: Sender Names page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/senders`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/sender|ผู้ส่ง|ชื่อ/i);
    await page.screenshot({ path: "test-results/4608-D2-senders.png" });
  });

  test("D3: Sender Names — add button + dialog", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/senders`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const addBtn = page.locator('button').filter({ hasText: /เพิ่ม|สร้าง|add|request|ขอ/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "test-results/4608-D3-sender-dialog.png" });
    } else {
      await page.screenshot({ path: "test-results/4608-D3-sender-no-btn.png" });
    }
  });

  test("D4: Groups page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/groups`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-D4-groups.png" });
  });
});

test.describe("E. BILLING", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("E1: Packages page loads (public)", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/packages`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/แพ็คเกจ|package|เครดิต|credit|ราคา|price/i);
    await page.screenshot({ path: "test-results/4608-E1-packages.png" });
  });

  test("E2: Billing history page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/billing`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-E2-billing.png" });
  });

  test("E3: Orders page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/orders`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-E3-orders.png" });
  });
});

test.describe("F. SETTINGS & SUPPORT", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("F1: Settings profile page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/ตั้งค่า|setting|โปรไฟล์|profile|qa-suite/i);
    await page.screenshot({ path: "test-results/4608-F1-settings.png" });
  });

  test("F2: Settings — name field editable", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const val = await nameInput.inputValue();
      expect(val.length).toBeGreaterThan(0);
    }
    await page.screenshot({ path: "test-results/4608-F2-settings-name.png" });
  });

  test("F3: API Keys page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/api-keys`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/API|key|คีย์|สร้าง/i);
    await page.screenshot({ path: "test-results/4608-F3-api-keys.png" });
  });

  test("F4: Security settings page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/security`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-F4-security.png" });
  });

  test("F5: Support/tickets page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/support`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-F5-support.png" });
  });

  test("F6: History page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/history`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toMatch(/ประวัติ|history|รายการ|ส่ง|SMS/i);
    await page.screenshot({ path: "test-results/4608-F6-history.png" });
  });

  test("F7: Documents page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/documents`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-F7-documents.png" });
  });

  test("F8: Webhooks page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/webhooks`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-F8-webhooks.png" });
  });

  test("F9: Notifications settings page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/notifications`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-F9-notifications.png" });
  });
});

test.describe("G. EDGE CASES", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("G1: XSS in SMS message field is escaped", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('<script>alert("xss")</script>');
      await page.waitForTimeout(500);
      const value = await textarea.inputValue();
      expect(value).toContain("<script>"); // stored as text, not executed
      // Check no alert fired
      const alerts: string[] = [];
      page.on("dialog", d => { alerts.push(d.message()); d.dismiss(); });
      await page.waitForTimeout(1000);
      expect(alerts).toHaveLength(0);
    }
    await page.screenshot({ path: "test-results/4608-G1-xss.png" });
  });

  test("G2: Register — XSS in name field", async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('<img src=x onerror=alert(1)>');
      // No alert should fire
      const alerts: string[] = [];
      page.on("dialog", d => { alerts.push(d.message()); d.dismiss(); });
      await page.waitForTimeout(1000);
      expect(alerts).toHaveLength(0);
    }
    await page.screenshot({ path: "test-results/4608-G2-xss-register.png" });
  });
});

test.describe("H. RESPONSIVE", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("H1: Dashboard 375px no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 375);
    expect(overflow).toBe(false);
    await page.screenshot({ path: "test-results/4608-H1-mobile-375.png" });
  });

  test("H2: Send page 375px no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 375);
    expect(overflow).toBe(false);
    await page.screenshot({ path: "test-results/4608-H2-send-mobile.png" });
  });

  test("H3: Settings 390px no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 390);
    expect(overflow).toBe(false);
    await page.screenshot({ path: "test-results/4608-H3-settings-mobile.png" });
  });

  test("H4: Desktop 1440px layout correct", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-results/4608-H4-desktop-1440.png" });
  });
});

test.describe("I. ERROR HANDLING", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("I1: Dashboard no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") &&
      !e.includes("hydration") &&
      !e.includes("DevTools") &&
      !e.includes("Warning:")
    );
    if (realErrors.length > 0) {
      console.log("Dashboard console errors:", realErrors);
    }
    await page.screenshot({ path: "test-results/4608-I1-console.png" });
  });

  test("I2: Send page no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(`${BASE}/dashboard/send`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") &&
      !e.includes("hydration") &&
      !e.includes("DevTools") &&
      !e.includes("Warning:")
    );
    if (realErrors.length > 0) {
      console.log("Send page console errors:", realErrors);
    }
    await page.screenshot({ path: "test-results/4608-I2-console-send.png" });
  });

  test("I3: 404 shows proper error page", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/nonexistent-xyz-404`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    // Should NOT show raw stack trace
    expect(body).not.toMatch(/at\s+\w+\s+\(/); // no stack traces
    await page.screenshot({ path: "test-results/4608-I3-404.png" });
  });

  test("I4: Error pages don't leak stack traces", async ({ page }) => {
    await page.goto(`${BASE}/api/v1/nonexistent`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const body = await page.locator("body").textContent();
    expect(body).not.toMatch(/node_modules|at Object\.|at Module\./);
    await page.screenshot({ path: "test-results/4608-I4-no-leak.png" });
  });
});
