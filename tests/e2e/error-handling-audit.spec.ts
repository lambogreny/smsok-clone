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
  await page.screenshot({ path: `screenshots/err-${name}.png`, fullPage: true });
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

// ===================== 1. EMPTY FORM SUBMIT =====================
test.describe("Error Handling: Empty Form Submit", () => {

  test("Register — empty submit", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/register`);
    await dismissCookies(page);
    await page.waitForTimeout(1500);

    const submitBtn = page.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled().catch(() => false);
    console.log(`Register submit disabled when empty: ${isDisabled}`);

    if (!isDisabled) {
      await submitBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await snap(page, "empty-register");
      const errors = await page.locator('[class*="error"], [role="alert"], [class*="invalid"], [class*="destructive"]').count();
      console.log(`Register empty: validation errors shown = ${errors}`);
    } else {
      console.log("✅ Register submit properly disabled when empty");
    }

    await ctx.close();
  });

  test("Login — empty submit", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await dismissCookies(page);

    const isDisabled = await page.locator('button[type="submit"]').isDisabled().catch(() => false);
    console.log(`✅ Login submit disabled when empty: ${isDisabled}`);
    await snap(page, "empty-login");

    await ctx.close();
  });

  test("Send SMS — empty submit", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/send`);
    await dismissCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Find send button
    const sendBtn = page.locator('button:has-text("ส่ง SMS"), button:has-text("Send"), button[type="submit"]').first();
    if (await sendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isDisabled = await sendBtn.isDisabled().catch(() => false);
      console.log(`SMS send disabled when empty: ${isDisabled}`);

      if (!isDisabled) {
        await sendBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await snap(page, "empty-sms-send");
        const bodyText = await page.locator("body").textContent().catch(() => "");
        const hasValidation = bodyText?.includes("กรุณา") || bodyText?.includes("required") || bodyText?.includes("จำเป็น");
        console.log(`SMS empty submit: validation shown = ${hasValidation}`);
      } else {
        console.log("✅ SMS send properly disabled when empty");
      }
    } else {
      console.log("⚠️ No send button found — page may show quota warning");
      await snap(page, "empty-sms-no-button");
    }

    await ctx.close();
  });

  test("Support ticket — empty submit", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/support/new`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const submitBtn = page.locator('button:has-text("ส่ง"), button:has-text("สร้าง"), button:has-text("Submit"), button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await snap(page, "empty-support");
      const errors = await page.locator('[class*="error"], [role="alert"], [class*="invalid"], [class*="destructive"], p:has-text("กรุณา")').count();
      console.log(`Support empty: validation errors = ${errors}`);
    }

    await ctx.close();
  });
});

// ===================== 2. INVALID INPUT =====================
test.describe("Error Handling: Invalid Input", () => {

  test("Register — invalid email, short password", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/register`);
    await dismissCookies(page);
    await page.waitForTimeout(1500);

    const results: string[] = [];

    // Invalid email
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill("not-an-email");
    await emailInput.blur();
    await page.waitForTimeout(500);
    let errorVisible = await page.locator('[class*="error"], [class*="invalid"], [class*="destructive"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    results.push(`Invalid email "not-an-email": error shown = ${errorVisible}`);

    // Short password
    const pwInput = page.locator('input[type="password"]').first();
    await pwInput.fill("12");
    await pwInput.blur();
    await page.waitForTimeout(500);
    errorVisible = await page.locator('[class*="error"], [class*="invalid"], [class*="destructive"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    results.push(`Short password "12": error shown = ${errorVisible}`);

    // Password mismatch
    const pw2 = page.locator('input[type="password"]').nth(1);
    if (await pw2.isVisible().catch(() => false)) {
      await page.locator('input[type="password"]').first().fill("Password123!");
      await pw2.fill("DifferentPass!");
      await pw2.blur();
      await page.waitForTimeout(500);
      errorVisible = await page.locator('[class*="error"], [class*="invalid"], [class*="destructive"]').first().isVisible({ timeout: 2000 }).catch(() => false);
      results.push(`Password mismatch: error shown = ${errorVisible}`);
    }

    await snap(page, "invalid-register");
    for (const r of results) console.log(`  ${r}`);

    await ctx.close();
  });

  test("Login — invalid email format", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await dismissCookies(page);

    await page.locator('input[type="email"]').fill("not-an-email");
    await page.locator('input[type="password"]').fill("anypassword");
    await page.waitForTimeout(500);

    const submitDisabled = await page.locator('button[type="submit"]').isDisabled().catch(() => false);
    console.log(`Login with invalid email: submit disabled = ${submitDisabled}`);
    await snap(page, "invalid-login-email");

    await ctx.close();
  });
});

// ===================== 3. LARGE INPUT =====================
test.describe("Error Handling: Large Input", () => {

  test("Contact name — 10,000 chars", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Quick Add")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const largeText = "A".repeat(10000);
        await nameInput.fill(largeText);
        const value = await nameInput.inputValue();
        console.log(`Contact name 10,000 chars: accepted length = ${value.length}`);

        // Try to submit
        const saveBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save"), button:has-text("เพิ่ม"), button[type="submit"]').last();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click({ force: true });
          await page.waitForTimeout(3000);
          await snap(page, "large-contact-name");

          const bodyText = await page.locator("body").textContent().catch(() => "");
          const hasError = bodyText?.includes("error") || bodyText?.includes("ผิดพลาด") || bodyText?.includes("ยาวเกิน");
          console.log(`Large name submit: error shown = ${hasError}`);
        }
      }
    }

    await ctx.close();
  });

  test("SMS message — 10,000 chars", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/send`);
    await dismissCookies(page);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const msgField = page.locator("textarea").first();
    if (await msgField.isVisible({ timeout: 5000 }).catch(() => false)) {
      const largeText = "ทดสอบ".repeat(2000);
      await msgField.fill(largeText);
      const value = await msgField.inputValue();
      console.log(`SMS message 10,000 chars: accepted length = ${value.length}`);

      // Check character counter
      const bodyText = await page.locator("body").textContent().catch(() => "");
      const hasCounter = bodyText?.includes("ตัวอักษร") || bodyText?.includes("chars") || bodyText?.includes("/");
      console.log(`SMS has character counter: ${hasCounter}`);

      await snap(page, "large-sms-message");
    }

    await ctx.close();
  });

  test("Search field — 1,000 chars", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const searchInput = page.locator('input[placeholder*="ค้นหา"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill("A".repeat(1000));
      await searchInput.press("Enter");
      await page.waitForTimeout(2000);
      await snap(page, "large-search");

      // Should not crash
      const bodyText = await page.locator("body").textContent().catch(() => "");
      const crashed = bodyText?.includes("500") || bodyText?.includes("Internal Server Error");
      console.log(`Large search (1000 chars): crashed = ${crashed}`);
    }

    await ctx.close();
  });
});

// ===================== 4. DOUBLE SUBMIT =====================
test.describe("Error Handling: Double Submit", () => {

  test("Login — double click submit", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    let loginRequests = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/login") && req.method() === "POST") {
        loginRequests++;
      }
    });

    await page.goto(`${BASE}/login`);
    await dismissCookies(page);
    await page.locator('input[type="email"]').fill(QA_USER.email);
    await page.locator('input[type="password"]').fill(QA_USER.password);
    await page.waitForFunction(
      () => !(document.querySelector('button[type="submit"]') as HTMLButtonElement)?.disabled,
      { timeout: 10000 }
    ).catch(() => {});

    // Double click rapidly
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.dblclick({ force: true });
    await page.waitForTimeout(5000);

    console.log(`Login double-click: API requests sent = ${loginRequests}`);
    console.log(`${loginRequests <= 1 ? "✅ SAFE" : "⚠️ CHECK"} Double submit prevention: ${loginRequests <= 1 ? "protected" : `${loginRequests} requests sent`}`);

    await snap(page, "double-login");
    await ctx.close();
  });

  test("Contact add — double click save", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();

    let contactRequests = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/v1/contacts") && req.method() === "POST") {
        contactRequests++;
      }
    });

    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("Quick Add")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      const nameInput = page.locator('input[name="name"], input[name="firstName"], input[placeholder*="ชื่อ"]').first();
      const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();

      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill(`DblClick Test ${Date.now()}`);
        if (await phoneInput.isVisible().catch(() => false)) {
          await phoneInput.fill(`09${String(Date.now()).slice(-8)}`);
        }

        const saveBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save"), button:has-text("เพิ่ม"), button[type="submit"]').last();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.dblclick({ force: true });
          await page.waitForTimeout(3000);

          console.log(`Contact double-click: POST requests = ${contactRequests}`);
          console.log(`${contactRequests <= 1 ? "✅ SAFE" : "⚠️ DUPLICATE"} Double submit: ${contactRequests} contacts created`);
        }
      }
    }

    await snap(page, "double-contact");
    await ctx.close();
  });
});

// ===================== 5. SPECIAL CHARACTERS IN FORMS =====================
test.describe("Error Handling: Special Characters", () => {

  test("Thai/Emoji/Unicode in all form fields", async ({ browser }) => {
    const ctx = await loginCtx(browser);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Company name with special chars
    const companyInput = page.locator('input[name="companyName"], input[name="company"]').first();
    if (await companyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tests = [
        { name: "Thai", value: "บริษัท ทดสอบ จำกัด" },
        { name: "Emoji", value: "Test 🏢 Company 🎯" },
        { name: "Special", value: "Test & Co. <Ltd>" },
        { name: "Quotes", value: 'O\'Brien "Corp"' },
      ];

      for (const t of tests) {
        await companyInput.clear();
        await companyInput.fill(t.value);
        const val = await companyInput.inputValue();
        console.log(`${val === t.value ? "✅" : "⚠️"} Settings company ${t.name}: input="${t.value.substring(0, 30)}" → stored="${val.substring(0, 30)}"`);
      }
    } else {
      console.log("⚠️ No company name input found");
    }

    await snap(page, "special-chars-settings");
    await ctx.close();
  });
});
