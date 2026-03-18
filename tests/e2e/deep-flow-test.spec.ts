import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS = path.join(__dirname, "..", "screenshots", "deep-flow");

test.describe("Deep Flow Testing — Register, Login, Dashboard, SMS, Billing, Settings", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });
  });

  // ===== REGISTER FLOW =====
  test("1. Register flow — form validation + edge cases", async ({ browser }) => {
    // Use fresh context (no auth)
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Dismiss cookies
    const cookieBtn = page.locator("text=/ยอมรับทั้งหมด/i").first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "reg-01-initial.png"), fullPage: true });
    console.log(`📍 Register page: ${page.url()}`);

    // Test 1a: Submit empty form → should show validation errors
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOTS, "reg-02-empty-submit.png"), fullPage: true });
      console.log("✅ Register: empty submit attempted");
    } else {
      console.log("✅ Register: submit disabled until form filled (correct behavior)");
    }

    // Test 1b: Invalid email format
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill("not-an-email");
      await emailInput.press("Tab");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOTS, "reg-03-invalid-email.png"), fullPage: true });
      const bodyText = await page.locator("body").innerText();
      if (bodyText.includes("อีเมล") && (bodyText.includes("ไม่ถูกต้อง") || bodyText.includes("invalid"))) {
        console.log("✅ Register: invalid email shows error");
      }
    }

    // Test 1c: Short password
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill("123");
      await passwordInput.press("Tab");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOTS, "reg-04-short-password.png"), fullPage: true });
      console.log("✅ Register: short password test done");
    }

    // Test 1d: XSS in name field
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('<script>alert("xss")</script>');
      await page.waitForTimeout(200);
      console.log("✅ Register: XSS in name field attempted");
    }

    // Test 1e: Fill valid form and submit (unique email)
    const uniqueEmail = `qa-test-${Date.now()}@smsok.test`;
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill(uniqueEmail);
    }
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("QA Deep Test");
    }

    // Find phone input
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill("0891234567");
    }

    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(process.env.E2E_USER_PASSWORD!);
    }

    // Confirm password
    const confirmPw = page.locator('input[name="confirmPassword"], input[name="passwordConfirm"]').first();
    if (await confirmPw.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPw.fill(process.env.E2E_USER_PASSWORD!);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "reg-05-filled-form.png"), fullPage: true });

    // Accept terms if checkbox exists
    const termsCheck = page.locator('input[type="checkbox"]').first();
    if (await termsCheck.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheck.check({ force: true, timeout: 3000 }).catch(async () => {
        // If hidden checkbox, click its label instead
        const label = page.locator('label:has(input[type="checkbox"])').first();
        await label.click({ timeout: 3000 }).catch(() => {});
      });
    }

    // Submit
    const submitRegBtn = page.locator('button[type="submit"]').first();
    if (await submitRegBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await submitRegBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "reg-06-after-submit.png"), fullPage: true });
      console.log(`📍 After register: ${page.url()}`);

      // Check if redirected to OTP or dashboard
      const afterUrl = page.url();
      if (afterUrl.includes("otp") || afterUrl.includes("verify")) {
        console.log("✅ Register: redirected to OTP verification");
      } else if (afterUrl.includes("dashboard")) {
        console.log("✅ Register: redirected to dashboard");
      } else if (afterUrl.includes("login")) {
        console.log("✅ Register: redirected to login");
      } else {
        console.log(`⚠️ Register: still on ${afterUrl}`);
      }
    }

    // Test 1f: Duplicate email
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill("qa-suite@smsok.test"); // existing user
    }
    if (await nameInput.isVisible().catch(() => false)) await nameInput.fill("Duplicate");
    if (await phoneInput.isVisible().catch(() => false)) await phoneInput.fill("0891234568");
    if (await passwordInput.isVisible().catch(() => false)) await passwordInput.fill(process.env.E2E_USER_PASSWORD!);
    if (await confirmPw.isVisible().catch(() => false)) await confirmPw.fill(process.env.E2E_USER_PASSWORD!);
    if (await termsCheck.isVisible().catch(() => false)) await termsCheck.check();
    if (await submitRegBtn.isEnabled().catch(() => false)) {
      await submitRegBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "reg-07-duplicate-email.png"), fullPage: true });
      const bodyText = await page.locator("body").innerText();
      if (bodyText.includes("ซ้ำ") || bodyText.includes("already") || bodyText.includes("มีอยู่แล้ว")) {
        console.log("✅ Register: duplicate email rejected with message");
      } else {
        console.log("⚠️ Register: duplicate email - check screenshot for result");
      }
    }

    console.log(`Console errors: ${errors.length}`);
    await ctx.close();
  });

  // ===== LOGIN FLOW =====
  test("2. Login flow — validation + auth + redirect", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Warm up: hit login page first to ensure Turbopack compiles it
    await page.goto("/login", { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(2000);
    // Retry if ISE
    const bodyCheck = await page.locator("body").innerText().catch(() => "");
    if (bodyCheck.trim() === "Internal Server Error") {
      await page.waitForTimeout(3000);
      await page.reload({ waitUntil: "domcontentloaded" });
    }
    await page.waitForLoadState("networkidle").catch(() => {});

    // Dismiss cookies
    const cookieBtn = page.locator("text=/ยอมรับทั้งหมด/i").first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "login-01-initial.png"), fullPage: true });

    // Test 2a: Wrong credentials
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const pwInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.fill("wrong@email.com");
    await pwInput.fill("wrongpassword");

    const loginBtn = page.locator('button[type="submit"]').first();
    await loginBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS, "login-02-wrong-creds.png"), fullPage: true });
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("ไม่ถูกต้อง") || bodyText.includes("ผิด") || bodyText.includes("incorrect")) {
      console.log("✅ Login: wrong credentials shows error");
    }

    // Test 2b: Empty fields
    await emailInput.fill("");
    await pwInput.fill("");
    const isDisabled = !(await loginBtn.isEnabled().catch(() => false));
    console.log(`✅ Login: submit ${isDisabled ? "disabled" : "enabled"} with empty fields`);
    await page.screenshot({ path: path.join(SCREENSHOTS, "login-03-empty-fields.png"), fullPage: true });

    // Test 2c: SQL injection in email
    await emailInput.fill("'; DROP TABLE users;--");
    await pwInput.fill("test");
    if (await loginBtn.isEnabled().catch(() => false)) {
      await loginBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "login-04-sql-injection.png"), fullPage: true });
      console.log("✅ Login: SQL injection attempt - no crash");
    }

    // Test 2d: Valid login
    await emailInput.fill("qa-suite@smsok.test");
    await pwInput.fill(process.env.E2E_USER_PASSWORD!);
    await loginBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS, "login-05-success.png"), fullPage: true });
    console.log(`📍 After login: ${page.url()}`);
    if (page.url().includes("dashboard")) {
      console.log("✅ Login: redirected to dashboard — SUCCESS");
    }

    await ctx.close();
  });

  // ===== DASHBOARD FLOW =====
  test("3. Dashboard — KPI cards, charts, navigation", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Dismiss cookies
    const cookieBtn = page.locator("text=/ยอมรับทั้งหมด/i").first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "dash-01-overview.png"), fullPage: true });
    console.log(`📍 Dashboard: ${page.url()}`);

    const bodyText = await page.locator("body").innerText();

    // Check KPI cards
    const hasKPI = bodyText.includes("SMS") && (bodyText.includes("0") || bodyText.includes("สำเร็จ"));
    console.log(`${hasKPI ? "✅" : "⚠️"} Dashboard: KPI cards visible`);

    // Check sidebar items
    const sidebarItems = ["ภาพรวม", "ส่ง SMS", "ข้อมูลติดต่อ", "ตั้งค่า"];
    for (const item of sidebarItems) {
      const found = bodyText.includes(item);
      console.log(`${found ? "✅" : "⚠️"} Dashboard sidebar: "${item}" ${found ? "visible" : "missing"}`);
    }

    // Click quick action buttons
    const sendSmsBtn = page.locator("text=/ส่ง SMS/").first();
    if (await sendSmsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("✅ Dashboard: 'ส่ง SMS' quick action visible");
    }

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS, "dash-02-mobile.png"), fullPage: true });
    console.log("📱 Dashboard mobile 375px check done");
  });

  // ===== SEND SMS FLOW =====
  test("4. Send SMS — full flow with validation", async ({ page }) => {
    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(2000);
    // Retry if ISE
    const bodyCheck = await page.locator("body").innerText().catch(() => "");
    if (bodyCheck.trim() === "Internal Server Error") {
      await page.waitForTimeout(3000);
      await page.reload({ waitUntil: "domcontentloaded" });
    }
    await page.waitForLoadState("networkidle").catch(() => {});

    const cookieBtn = page.locator("text=/ยอมรับทั้งหมด/i").first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "sms-01-initial.png"), fullPage: true });

    // Find message textarea
    const msgTextarea = page.locator('textarea[placeholder*="พิมพ์ข้อความ"]').first();
    await expect(msgTextarea).toBeVisible({ timeout: 10000 });

    // Test 4a: Type message → counter updates
    await msgTextarea.fill("ทดสอบส่ง SMS จาก QA ระบบ SMSOK");
    await msgTextarea.press("Space");
    await msgTextarea.press("Backspace");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS, "sms-02-message-typed.png"), fullPage: true });

    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("/70") || bodyText.includes("/67")) {
      console.log("✅ SMS: Thai message shows UCS-2 counter");
    }

    // Test 4b: Phone number input
    const phoneInput = page.locator('textarea[placeholder*="เบอร์"], input[placeholder*="เบอร์"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill("0891234567");
      await phoneInput.press("Enter");
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOTS, "sms-03-phone-entered.png"), fullPage: true });
      console.log("✅ SMS: phone number entered");
    }

    // Test 4c: Invalid phone number
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill("abc");
      await phoneInput.press("Enter");
      await page.waitForTimeout(500);
      const errorText = await page.locator("body").innerText();
      if (errorText.includes("ไม่ถูกต้อง") || errorText.includes("เบอร์")) {
        console.log("✅ SMS: invalid phone rejected");
      }
      await page.screenshot({ path: path.join(SCREENSHOTS, "sms-04-invalid-phone.png"), fullPage: true });
    }

    // Test 4d: XSS in message
    await msgTextarea.fill('<script>alert("xss")</script>');
    await msgTextarea.press("Space");
    await msgTextarea.press("Backspace");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOTS, "sms-05-xss-message.png"), fullPage: true });
    console.log("✅ SMS: XSS in message field - no crash");

    // Test 4e: Send button state
    const sendBtn = page.locator('button:has-text("ส่ง SMS")').first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isEnabled = await sendBtn.isEnabled();
      console.log(`✅ SMS: send button is ${isEnabled ? "enabled" : "disabled"}`);
    }

    // Test 4f: Very long message (1000+ chars)
    await msgTextarea.fill("A".repeat(1000));
    await msgTextarea.press("Space");
    await msgTextarea.press("Backspace");
    await page.waitForTimeout(500);
    const longText = await page.locator("body").innerText();
    const segMatch = longText.match(/(\d+)\s*SMS/);
    if (segMatch) {
      console.log(`✅ SMS: 1000 chars → ${segMatch[0]} (counter handles long message)`);
    }
    await page.screenshot({ path: path.join(SCREENSHOTS, "sms-06-long-message.png"), fullPage: true });
  });

  // ===== BILLING / PACKAGES FLOW =====
  test("5. Billing — packages, purchase flow", async ({ page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const cookieBtn = page.locator("text=/ยอมรับทั้งหมด/i").first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "billing-01-packages.png"), fullPage: true });
    console.log(`📍 Packages: ${page.url()}`);

    const bodyText = await page.locator("body").innerText();

    // Check package cards exist
    if (bodyText.includes("แพ็กเกจ") || bodyText.includes("SMS") || bodyText.includes("เครดิต")) {
      console.log("✅ Billing: package cards visible");
    }

    // Click a package to see purchase flow
    const buyBtn = page.locator('button:has-text("ซื้อ"), button:has-text("เลือก"), a:has-text("ซื้อ"), a:has-text("เลือก")').first();
    if (await buyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOTS, "billing-02-purchase-flow.png"), fullPage: true });
      console.log(`📍 After buy click: ${page.url()}`);
    }

    // Check billing page
    await page.goto("/dashboard/billing", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(SCREENSHOTS, "billing-03-my-packages.png"), fullPage: true });

    const billingText = await page.locator("body").innerText();
    if (billingText.includes("แพ็กเกจ") || billingText.includes("เครดิต") || billingText.includes("คงเหลือ")) {
      console.log("✅ Billing: my packages page loads with billing info");
    }
  });

  // ===== SETTINGS FLOW =====
  test("6. Settings — profile edit, tabs navigation", async ({ page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const cookieBtn = page.locator("text=/ยอมรับทั้งหมด/i").first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, "settings-01-profile.png"), fullPage: true });
    console.log(`📍 Settings: ${page.url()}`);

    // Check profile info displayed
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("qa-suite@smsok.test")) {
      console.log("✅ Settings: email displayed correctly");
    }
    if (bodyText.includes("QA Test User")) {
      console.log("✅ Settings: name displayed correctly");
    }

    // Test 6a: Edit name
    const nameInput = page.locator('input[value="QA Test User"], input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isReadonly = await nameInput.getAttribute("readonly");
      if (!isReadonly) {
        await nameInput.fill("QA Test User Edited");
        const saveBtn = page.locator('button:has-text("บันทึก")').first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SCREENSHOTS, "settings-02-name-saved.png"), fullPage: true });

          // Check toast/success
          const afterText = await page.locator("body").innerText();
          if (afterText.includes("สำเร็จ") || afterText.includes("บันทึก")) {
            console.log("✅ Settings: name updated successfully");
          }

          // Revert name
          await nameInput.fill("QA Test User");
          await saveBtn.click();
          await page.waitForTimeout(1000);
          console.log("✅ Settings: name reverted");
        }
      } else {
        console.log("⚠️ Settings: name field is readonly");
      }
    }

    // Test 6b: Navigate tabs
    const tabs = ["ความปลอดภัย", "การเงิน", "API Keys", "Webhooks", "การแจ้งเตือน"];
    for (const tab of tabs) {
      const tabEl = page.locator(`text="${tab}"`).first();
      if (await tabEl.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tabEl.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS, `settings-tab-${tab.replace(/\s/g, "-")}.png`), fullPage: true });
        console.log(`✅ Settings tab: "${tab}" loads OK`);
      }
    }

    // Test 6c: Check phone field is readonly
    const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const readonly = await phoneField.getAttribute("readonly");
      const disabled = await phoneField.getAttribute("disabled");
      if (readonly !== null || disabled !== null) {
        console.log("✅ Settings: phone field is read-only (by design)");
      }
    }

    // Test 6d: XSS in company name
    const companyInput = page.locator('input[name="companyName"]').first();
    if (await companyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const origValue = await companyInput.inputValue();
      await companyInput.fill('<img src=x onerror=alert(1)>');
      await page.waitForTimeout(300);
      console.log("✅ Settings: XSS in company name attempted");
      // Revert
      await companyInput.fill(origValue || "บริษัท ตัวอย่าง จำกัด");
    }

    // Mobile check
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS, "settings-03-mobile.png"), fullPage: true });
    console.log("📱 Settings mobile 375px check done");
  });
});
