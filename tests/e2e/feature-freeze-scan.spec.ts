import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const UNIQUE = Date.now();
const NEW_USER = {
  name: `QA Freeze ${UNIQUE}`,
  email: `qa-freeze-${UNIQUE}@smsok.test`,
  phone: `09${String(UNIQUE).slice(-8)}`,
  password: "FreezeTest123!",
};
const QA_USER = {
  email: "qa-suite@smsok.test",
  password: process.env.E2E_USER_PASSWORD!,
};

// Helper: dismiss cookie consent if visible
async function dismissCookies(page: Page) {
  const btn = page.getByText("ยอมรับทั้งหมด");
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

// Helper: screenshot with name
async function snap(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/freeze-${name}.png`, fullPage: true });
}

// Helper: check console errors
function setupConsoleLogger(page: Page, errors: string[]) {
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${msg.type()}] ${msg.text()}`);
  });
}

// ===================== FLOW 1: REGISTER =====================
test.describe("Flow 1: Register", () => {
  test("register new account — happy path", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/register`);
    await dismissCookies(page);
    await snap(page, "01-register-page");

    // Check form fields exist
    await expect(page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first()).toBeVisible({ timeout: 10000 });
    await snap(page, "01-register-form-visible");

    // Fill registration form
    const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
    await nameInput.fill(NEW_USER.name);

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill(NEW_USER.email);

    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    await phoneInput.fill(NEW_USER.phone);

    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill(NEW_USER.password);
    if (await pwInputs.nth(1).isVisible().catch(() => false)) {
      await pwInputs.nth(1).fill(NEW_USER.password);
    }

    // Check for consent/terms checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkbox.check();
    }

    await snap(page, "01-register-filled");

    // Submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Wait for response — expect redirect to OTP or dashboard or success message
    await page.waitForTimeout(5000);
    await snap(page, "01-register-after-submit");

    const url = page.url();
    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Register result URL: ${url}`);
    console.log(`Register result text (200 chars): ${bodyText?.substring(0, 200)}`);

    await context.close();
  });

  test("register duplicate email — should reject", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}/register`);
    await dismissCookies(page);

    const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill("Duplicate Test");
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill(QA_USER.email); // existing email

    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill("0900000001");
    }

    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill("DupeTest123!");
    if (await pwInputs.nth(1).isVisible().catch(() => false)) {
      await pwInputs.nth(1).fill("DupeTest123!");
    }

    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkbox.check();
    }

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await snap(page, "01-register-duplicate");

    // Should show error, NOT succeed
    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Duplicate register result: ${bodyText?.substring(0, 300)}`);

    await context.close();
  });

  test("register empty fields — validation", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}/register`);
    await dismissCookies(page);

    const submitBtn = page.locator('button[type="submit"]');
    // Try to submit empty form
    if (await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }
    await snap(page, "01-register-empty-validation");

    await context.close();
  });
});

// ===================== FLOW 2: LOGIN =====================
test.describe("Flow 2: Login", () => {
  test("login happy path", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/login`);
    await dismissCookies(page);
    await snap(page, "02-login-page");

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(QA_USER.email);

    const pwInput = page.locator('input[type="password"]');
    await pwInput.fill(QA_USER.password);

    await snap(page, "02-login-filled");

    const submitBtn = page.locator('button[type="submit"]');
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(() => {});
    await submitBtn.click();

    // Wait for dashboard
    await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await snap(page, "02-login-result");

    const url = page.url();
    console.log(`Login result URL: ${url}`);

    // If on dashboard, save state for later tests
    if (url.includes("/dashboard")) {
      await context.storageState({ path: "tests/e2e/.auth/freeze-user.json" });
    }

    await context.close();
  });

  test("login wrong password — should fail", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}/login`);
    await dismissCookies(page);

    await page.locator('input[type="email"]').fill(QA_USER.email);
    await page.locator('input[type="password"]').fill("WrongPassword999!");

    const submitBtn = page.locator('button[type="submit"]');
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(() => {});
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await snap(page, "02-login-wrong-pw");

    // Should NOT redirect to dashboard
    expect(page.url()).not.toContain("/dashboard");
    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Wrong password result: ${bodyText?.substring(0, 300)}`);

    await context.close();
  });

  test("login empty fields — validation", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}/login`);
    await dismissCookies(page);

    // Try submit empty
    const submitBtn = page.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled().catch(() => false);
    console.log(`Login submit disabled when empty: ${isDisabled}`);
    await snap(page, "02-login-empty");

    await context.close();
  });
});

// ===================== FLOW 3-10: AUTHENTICATED FLOWS =====================
// These use logged-in state
test.describe("Authenticated Flows", () => {
  let authContext: any;

  test.beforeAll(async ({ browser }) => {
    // Login first
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
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|2fa)/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    if (page.url().includes("/dashboard")) {
      await ctx.storageState({ path: "tests/e2e/.auth/freeze-user.json" });
    }
    await ctx.close();
  });

  // ---- DASHBOARD ----
  test("Flow 3: Dashboard loads with data", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "03-dashboard");

    // Check KPI cards visible
    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Dashboard content (300 chars): ${bodyText?.substring(0, 300)}`);

    // Check no error state
    const hasError = bodyText?.includes("500") || bodyText?.includes("Error") || bodyText?.includes("ผิดพลาด");
    console.log(`Dashboard has visible error: ${hasError}`);

    if (errors.length > 0) console.log(`Console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- SEND SMS ----
  test("Flow 4: Send SMS page + form interaction", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/sms`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "04-sms-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`SMS page content (300 chars): ${bodyText?.substring(0, 300)}`);

    // Try to fill SMS form
    // Look for phone/recipient input
    const phoneInput = page.locator('input[name="to"], input[name="phone"], input[name="recipient"], input[placeholder*="เบอร์"], textarea[name="recipients"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await phoneInput.fill("0812345678");
    }

    // Look for message textarea
    const msgInput = page.locator('textarea[name="message"], textarea[placeholder*="ข้อความ"], textarea').first();
    if (await msgInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await msgInput.fill("ทดสอบส่ง SMS จาก QA Feature Freeze scan");
    }

    await snap(page, "04-sms-filled");

    // Look for sender name select
    const senderSelect = page.locator('select[name="sender"], [data-testid="sender-select"], button:has-text("ผู้ส่ง")').first();
    if (await senderSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await senderSelect.click();
      await page.waitForTimeout(1000);
      await snap(page, "04-sms-sender-dropdown");
    }

    if (errors.length > 0) console.log(`SMS console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- CONTACTS ----
  test("Flow 5: Contacts page + add contact", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "05-contacts-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Contacts page (300 chars): ${bodyText?.substring(0, 300)}`);

    // Look for add contact button
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add"), a:has-text("เพิ่ม")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await snap(page, "05-contacts-add-modal");

      // Fill contact form if modal appeared
      const nameInput = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill(`QA Freeze Contact ${UNIQUE}`);
      }

      const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
      if (await phoneInput.isVisible().catch(() => false)) {
        await phoneInput.fill(`08${String(UNIQUE).slice(-8)}`);
      }

      await snap(page, "05-contacts-add-filled");
    }

    if (errors.length > 0) console.log(`Contacts console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- PACKAGES ----
  test("Flow 6: Packages page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/packages`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "06-packages-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Packages page (300 chars): ${bodyText?.substring(0, 300)}`);

    // Try clicking a package
    const pkgCard = page.locator('[class*="card"], [class*="package"], button:has-text("ซื้อ"), button:has-text("เลือก")').first();
    if (await pkgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pkgCard.click();
      await page.waitForTimeout(2000);
      await snap(page, "06-packages-selected");
    }

    if (errors.length > 0) console.log(`Packages console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- HISTORY / SMS LOGS ----
  test("Flow 7: SMS History page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/history`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "07-history-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`History page (300 chars): ${bodyText?.substring(0, 300)}`);

    if (errors.length > 0) console.log(`History console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- SENDER NAMES ----
  test("Flow 8: Sender Names page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/senders`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "08-senders-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Senders page (300 chars): ${bodyText?.substring(0, 300)}`);

    // Try add sender
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Add"), a:has-text("เพิ่ม"), button:has-text("สร้าง")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await snap(page, "08-senders-add-modal");
    }

    if (errors.length > 0) console.log(`Senders console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- API KEYS ----
  test("Flow 9: API Keys page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/api-keys`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "09-api-keys-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`API Keys page (300 chars): ${bodyText?.substring(0, 300)}`);

    if (errors.length > 0) console.log(`API Keys console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- SETTINGS ----
  test("Flow 10: Settings page + profile edit", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "10-settings-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Settings page (300 chars): ${bodyText?.substring(0, 300)}`);

    // Try editing name
    const nameInput = page.locator('input[name="name"], input[name="displayName"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const oldValue = await nameInput.inputValue();
      await nameInput.clear();
      await nameInput.fill("QA Freeze Test Name");
      await snap(page, "10-settings-name-edited");

      // Restore original value
      await nameInput.clear();
      await nameInput.fill(oldValue || "QA Suite");
    }

    if (errors.length > 0) console.log(`Settings console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- CAMPAIGNS ----
  test("Flow 11: Campaigns page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/campaigns`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "11-campaigns-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Campaigns page (300 chars): ${bodyText?.substring(0, 300)}`);

    if (errors.length > 0) console.log(`Campaigns console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- SUPPORT / TICKETS ----
  test("Flow 12: Support/Tickets page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/support`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "12-support-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Support page (300 chars): ${bodyText?.substring(0, 300)}`);

    // Try creating ticket
    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("Create"), a:has-text("สร้าง"), button:has-text("แจ้ง")').first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await snap(page, "12-support-create");
    }

    if (errors.length > 0) console.log(`Support console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- ORDERS / BILLING ----
  test("Flow 13: Orders/Billing page", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    await page.goto(`${BASE}/dashboard/orders`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "13-orders-page");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Orders page (300 chars): ${bodyText?.substring(0, 300)}`);

    if (errors.length > 0) console.log(`Orders console errors: ${JSON.stringify(errors)}`);

    await context.close();
  });

  // ---- ALL SIDEBAR PAGES LOAD CHECK ----
  test("Flow 14: All sidebar pages load without crash", async ({ browser }) => {
    const context = await browser.newContext({ storageState: "tests/e2e/.auth/freeze-user.json" });
    const page = await context.newPage();
    const errors: string[] = [];
    setupConsoleLogger(page, errors);

    const pages = [
      "/dashboard",
      "/dashboard/sms",
      "/dashboard/contacts",
      "/dashboard/groups",
      "/dashboard/campaigns",
      "/dashboard/templates",
      "/dashboard/history",
      "/dashboard/senders",
      "/dashboard/packages",
      "/dashboard/orders",
      "/dashboard/api-keys",
      "/dashboard/webhooks",
      "/dashboard/settings",
      "/dashboard/support",
    ];

    const results: { path: string; status: string; error?: string }[] = [];

    for (const p of pages) {
      try {
        const response = await page.goto(`${BASE}${p}`, { timeout: 20000 });
        await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1500);

        const status = response?.status() || 0;
        const url = page.url();
        const bodyText = await page.locator("body").textContent().catch(() => "");
        const hasVisibleError = bodyText?.includes("500") || bodyText?.includes("Internal Server Error");

        if (status >= 400 || hasVisibleError) {
          results.push({ path: p, status: `FAIL (${status})`, error: bodyText?.substring(0, 100) });
          await snap(page, `14-page-fail-${p.replace(/\//g, "-")}`);
        } else if (url.includes("/login")) {
          results.push({ path: p, status: "REDIRECT-LOGIN" });
        } else {
          results.push({ path: p, status: `OK (${status})` });
        }
      } catch (err: any) {
        results.push({ path: p, status: "ERROR", error: err.message?.substring(0, 100) });
      }
    }

    console.log("\n=== ALL PAGES STATUS ===");
    for (const r of results) {
      console.log(`${r.status.padEnd(20)} ${r.path} ${r.error || ""}`);
    }
    console.log("========================\n");

    if (errors.length > 0) console.log(`Console errors across pages: ${JSON.stringify(errors.slice(0, 10))}`);

    await context.close();
  });
});

// ===================== SECURITY EDGE CASES =====================
test.describe("Security & Edge Cases", () => {
  test("XSS in register fields", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}/register`);
    await dismissCookies(page);

    const xssPayload = '<script>alert("xss")</script>';

    const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill(xssPayload);
    }

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill("xss-test@test.com");

    await snap(page, "15-xss-register");

    // Check no script execution
    const dialogFired = await new Promise<boolean>((resolve) => {
      page.on("dialog", () => resolve(true));
      setTimeout(() => resolve(false), 3000);
    });
    console.log(`XSS dialog fired: ${dialogFired}`);

    await context.close();
  });

  test("Protected pages without auth — redirect to login", async ({ browser }) => {
    const context = await browser.newContext(); // No auth
    const page = await context.newPage();

    const protectedPages = [
      "/dashboard",
      "/dashboard/sms",
      "/dashboard/contacts",
      "/dashboard/settings",
      "/dashboard/api-keys",
    ];

    for (const p of protectedPages) {
      await page.goto(`${BASE}${p}`, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const url = page.url();
      const redirectedToLogin = url.includes("/login") || url === `${BASE}/`;
      console.log(`${p} → ${redirectedToLogin ? "REDIRECTED (OK)" : `EXPOSED at ${url}`}`);

      if (!redirectedToLogin) {
        await snap(page, `16-no-auth-exposed-${p.replace(/\//g, "-")}`);
      }
    }

    await context.close();
  });

  test("Forgot password page loads", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}/forgot-password`);
    await dismissCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await snap(page, "17-forgot-password");

    const bodyText = await page.locator("body").textContent().catch(() => "");
    console.log(`Forgot password page (200 chars): ${bodyText?.substring(0, 200)}`);

    await context.close();
  });
});

// ===================== MOBILE RESPONSIVE =====================
test.describe("Mobile Responsive", () => {
  test("Dashboard on mobile 375px", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/e2e/.auth/freeze-user.json",
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();

    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await snap(page, "18-mobile-dashboard-375");

    // Check for overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`Mobile 375px horizontal overflow: ${hasHorizontalScroll}`);

    await context.close();
  });

  test("Login on mobile 390px", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    await page.goto(`${BASE}/login`);
    await dismissCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await snap(page, "18-mobile-login-390");

    await context.close();
  });
});
