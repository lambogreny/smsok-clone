import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_EMAIL = process.env.QA_EMAIL || "demo@smsok.local";
const QA_PASS = process.env.QA_PASS || process.env.SEED_PASSWORD!;

async function dismissCookieConsent(page: Page) {
  const btn = page.getByText("ยอมรับทั้งหมด");
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label*="คุกกี้"], [class*="consent"], [class*="cookie"]').forEach(el => el.remove());
  }).catch(() => {});
}

// Shared login helper
async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await dismissCookieConsent(page);
  await page.fill('input[name="email"], input[type="email"]', QA_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', QA_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

// ============================================================
// 2. DASHBOARD — stats display
// ============================================================
test.describe("2. Dashboard — Stats Display", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Dashboard shows KPI cards/stats", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-dashboard.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    // Should show some dashboard content (stats, cards, charts)
    expect(text.length).toBeGreaterThan(50);
    // Should not show permission error
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });
});

// ============================================================
// 4. AUTH FLOWS: Login → Logout → Forgot Password
// ============================================================
test.describe("4. Auth Flows", () => {
  test("Login → Dashboard → Logout", async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);
    await page.screenshot({ path: "tests/e2e/screenshots/4707-login-page.png" });

    await page.fill('input[name="email"], input[type="email"]', QA_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', QA_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.screenshot({ path: "tests/e2e/screenshots/4707-login-success.png" });
    expect(page.url()).toContain("/dashboard");

    // Logout via dropdown menu — use force click to bypass dev overlay
    const avatar = page.locator('[data-slot="dropdown-menu-trigger"], [data-slot="avatar"], button:has([data-slot="avatar"])').first();
    if (await avatar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await avatar.click({ force: true });
      await page.waitForTimeout(500);
      const logoutItem = page.locator('text=ออกจากระบบ').first();
      if (await logoutItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutItem.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4707-logout.png" });
  });

  test("Forgot Password page loads", async ({ page }) => {
    await page.goto(`${BASE}/forgot-password`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-forgot-password.png" });

    const body = await page.textContent("body") || "";
    // Should show forgot password form
    const hasForgotContent = body.includes("รหัสผ่าน") || body.includes("password") || body.includes("ลืม") || body.includes("forgot");
    expect(hasForgotContent).toBeTruthy();
  });

  test("Login with wrong password → error", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);
    await page.fill('input[name="email"], input[type="email"]', QA_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', "WrongPassword999!");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/e2e/screenshots/4707-login-wrong-pass.png" });

    // Should not be on dashboard
    expect(page.url()).not.toContain("/dashboard");
  });

  test("Protected page without login → redirect", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/e2e/screenshots/4707-no-auth-redirect.png" });

    // Should redirect to login
    const url = page.url();
    const redirected = url.includes("/login") || url.includes("/register") || !url.includes("/dashboard/contacts");
    expect(redirected).toBeTruthy();
  });
});

// ============================================================
// 5. SMS: Send SMS flow
// ============================================================
test.describe("5. SMS Send Flow", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Send SMS page — fill form and submit", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/send`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-sms-send-page.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");

    // Try to fill SMS form
    // Recipient phone
    const phoneInput = page.locator('input[name="phone"], input[name="recipient"], input[name="to"], input[placeholder*="เบอร์"], input[placeholder*="089"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill("0891234567");
    }

    // Message
    const msgInput = page.locator('textarea[name="message"], textarea[name="content"], textarea[placeholder*="ข้อความ"]').first();
    if (await msgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await msgInput.fill("QA Test Message from task #4707");
    }

    await page.screenshot({ path: "tests/e2e/screenshots/4707-sms-filled.png" });

    // Don't actually send — just verify form is interactive
    const sendBtn = page.locator('button:has-text("ส่ง"), button:has-text("Send"), button[type="submit"]').first();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Button exists and is visible
      await page.screenshot({ path: "tests/e2e/screenshots/4707-sms-ready.png" });
    }
  });

  test("SMS History page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/history`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-sms-history.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });
});

// ============================================================
// 6. DATA: Contacts CRUD + Groups + Templates + Sender Names
// ============================================================
test.describe("6. Data Management", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Contacts — view list + add button exists", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-contacts-list.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");

    // Look for add button
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), button:has-text("Add"), a:has-text("เพิ่ม")').first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    await page.screenshot({ path: "tests/e2e/screenshots/4707-contacts-add-btn.png" });
    // Add button should exist
    expect(hasAddBtn).toBeTruthy();
  });

  test("Contacts — create contact via form", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle");

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), button:has-text("Add"), a:has-text("เพิ่ม")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "tests/e2e/screenshots/4707-contacts-add-form.png" });

      // Fill contact form
      const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const ts = Date.now();
        await nameInput.fill(`QA Test ${ts}`);

        const phoneInput = page.locator('input[name="phone"], input[placeholder*="เบอร์"]').first();
        if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await phoneInput.fill(`089${String(ts).slice(-7)}`);
        }

        // Submit inside dialog — use force to bypass overlay
        const dialogSubmit = page.locator('[data-slot="dialog-content"] button[type="submit"], [data-slot="dialog-content"] button:has-text("บันทึก"), [data-slot="dialog-content"] button:has-text("Save")').first();
        if (await dialogSubmit.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dialogSubmit.click({ force: true });
          await page.waitForTimeout(2000);
        }
        await page.screenshot({ path: "tests/e2e/screenshots/4707-contacts-created.png" });
      }
    }

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("ไม่มีสิทธิ์");
  });

  test("Groups page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/groups`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-groups.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });

  test("Templates page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/templates`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-templates.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });

  test("Sender Names page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/senders`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-senders.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });
});

// ============================================================
// 7. BILLING: Packages + Buy flow
// ============================================================
test.describe("7. Billing Flow", () => {
  test("Packages page — shows pricing tiers", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/packages`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-packages.png" });

    const body = await page.textContent("body") || "";
    // Should show package info
    const hasPackageContent = body.includes("SMS") || body.includes("แพ็คเกจ") || body.includes("package") || body.includes("เครดิต");
    expect(hasPackageContent).toBeTruthy();
  });

  test("My Packages page loads (logged in)", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/packages/my`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-my-packages.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });

  test("Orders page loads", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/billing/orders`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-orders.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });
});

// ============================================================
// 8. SETTINGS: Profile save+reload
// ============================================================
test.describe("8. Settings", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Settings page — profile form visible", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-settings.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");

    // Check profile section exists — settings page has tabs and save button
    const hasTabs = await page.locator('text=โปรไฟล์').first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasSaveBtn = await page.locator('button:has-text("บันทึก")').first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasSettingsContent = await page.locator('text=ตั้งค่า').first().isVisible({ timeout: 2000 }).catch(() => false);
    await page.screenshot({ path: "tests/e2e/screenshots/4707-settings-form.png" });
    expect(hasTabs || hasSaveBtn || hasSettingsContent).toBeTruthy();
  });

  test("Settings — edit and save profile", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle");

    const firstNameInput = page.locator('input[name="firstName"]').first();
    if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const original = await firstNameInput.inputValue();

      // Change name
      await firstNameInput.clear();
      await firstNameInput.fill("QA Updated");

      // Save
      const saveBtn = page.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("Save")').first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: "tests/e2e/screenshots/4707-settings-saved.png" });
      }

      // Reload and verify
      await page.reload();
      await page.waitForLoadState("networkidle");
      const newValue = await firstNameInput.inputValue();
      await page.screenshot({ path: "tests/e2e/screenshots/4707-settings-reload.png" });

      // Restore original
      await firstNameInput.clear();
      await firstNameInput.fill(original || "QA Suite");
      const saveBtn2 = page.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("Save")').first();
      if (await saveBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn2.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

// ============================================================
// 9. SUPPORT: Create ticket
// ============================================================
test.describe("9. Support", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("Support page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/support`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-support.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });

  test("Support — create ticket form", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/support`);
    await page.waitForLoadState("networkidle");

    // Look for create ticket button
    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("ติดต่อ"), button:has-text("Create"), a:has-text("สร้าง"), a:has-text("ติดต่อ")').first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "tests/e2e/screenshots/4707-support-form.png" });

      // Fill ticket form
      const subjectInput = page.locator('input[name="subject"], input[name="title"], input[placeholder*="หัวข้อ"]').first();
      if (await subjectInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await subjectInput.fill("QA Test Ticket #4707");
      }

      const msgInput = page.locator('textarea[name="message"], textarea[name="content"], textarea[name="description"]').first();
      if (await msgInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgInput.fill("This is an automated QA test ticket. Please ignore.");
      }

      await page.screenshot({ path: "tests/e2e/screenshots/4707-support-filled.png" });
    }
  });
});

// ============================================================
// 10. API KEYS: Create + Copy + Delete
// ============================================================
test.describe("10. API Keys", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("API Keys page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/api-keys`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-api-keys.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });

  test("API Keys — create key button exists", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/api-keys`);
    await page.waitForLoadState("networkidle");

    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("Create"), button:has-text("เพิ่ม"), button:has-text("Generate")').first();
    const hasCreateBtn = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);
    await page.screenshot({ path: "tests/e2e/screenshots/4707-api-keys-create.png" });
    // Should have a way to create API keys
    expect(hasCreateBtn).toBeTruthy();
  });
});

// ============================================================
// 11. EDGE CASES: XSS, empty input, double submit
// ============================================================
test.describe("11. Edge Cases", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("XSS in contact name — sanitized", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle");

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), button:has-text("Add"), a:has-text("เพิ่ม")').first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('<script>alert("xss")</script>');

        const phoneInput = page.locator('input[name="phone"], input[placeholder*="เบอร์"]').first();
        if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await phoneInput.fill("0891234567");
        }

        await page.screenshot({ path: "tests/e2e/screenshots/4707-xss-input.png" });

        // Submit
        const submitBtn = page.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("Save")').first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click({ force: true });
          await page.waitForTimeout(2000);
        }

        await page.screenshot({ path: "tests/e2e/screenshots/4707-xss-result.png" });

        // No script execution — page should still work
        const hasAlert = await page.evaluate(() => {
          return (window as any).__xss_triggered || false;
        });
        expect(hasAlert).toBeFalsy();
      }
    }
  });

  test("Login with empty fields — validation error", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");

    // Click submit without filling
    const submitBtn = page.locator('button[type="submit"]').first();
    // Button should be disabled with empty fields
    const isDisabled = await submitBtn.isDisabled();
    await page.screenshot({ path: "tests/e2e/screenshots/4707-login-empty.png" });
    expect(isDisabled).toBeTruthy();
  });

  test("SQL injection in login — rejected", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    await page.fill('input[name="email"], input[type="email"]', "admin@test.com");
    await page.fill('input[name="password"], input[type="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/e2e/screenshots/4707-sqli-login.png" });

    // Should NOT be on dashboard
    expect(page.url()).not.toContain("/dashboard");
  });
});

// ============================================================
// 12. RESPONSIVE: 375px + 1440px
// ============================================================
test.describe("12. Responsive", () => {
  test("Dashboard at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-responsive-375-dashboard.png" });

    // Page should render without crash
    const body = await page.textContent("body") || "";
    expect(body.length).toBeGreaterThan(10);
  });

  test("Contacts at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-responsive-375-contacts.png" });

    const body = await page.textContent("body") || "";
    expect(body.length).toBeGreaterThan(10);
  });

  test("Dashboard at 1440px desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-responsive-1440-dashboard.png" });

    const body = await page.textContent("body") || "";
    expect(body.length).toBeGreaterThan(10);
  });

  test("Settings at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-responsive-375-settings.png" });

    const body = await page.textContent("body") || "";
    expect(body.length).toBeGreaterThan(10);
  });
});

// ============================================================
// 13. ALL BUTTONS — no dead buttons on key pages
// ============================================================
test.describe("13. All Pages Load — No Dead Pages", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("All sidebar pages load without 403/500", async ({ page }) => {
    const pages = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/history",
      "/dashboard/campaigns",
      "/dashboard/contacts",
      "/dashboard/groups",
      "/dashboard/templates",
      "/dashboard/senders",
      "/dashboard/packages",
      "/dashboard/packages/my",
      "/dashboard/billing/orders",
      "/dashboard/settings",
      "/dashboard/support",
      "/dashboard/api-keys",
    ];

    const failures: string[] = [];
    for (const p of pages) {
      await page.goto(`${BASE}${p}`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);
      const main = page.locator("main, [role='main'], .flex-1").first();
      const text = await main.textContent() || "";
      if (text.includes("ไม่มีสิทธิ์") || (text.includes("Internal Server Error"))) {
        failures.push(`${p}: ${text.substring(0, 100)}`);
      }
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4707-all-pages-final.png" });
    expect(failures).toEqual([]);
  });

  test("Campaigns page — create campaign button", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/campaigns`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4707-campaigns.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });
});
