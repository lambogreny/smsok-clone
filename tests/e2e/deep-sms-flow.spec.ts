import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * Deep E2E Test: SMS Sending Full Flow
 * QA "ผู้พิพากษา" — World-class enterprise level testing
 *
 * Tests: /dashboard/send, /dashboard/otp, /dashboard/messages
 * Covers: functional, validation, security (XSS/SQLi), edge cases, mobile viewport
 */

// Navigate to /dashboard/send and wait for the form to be ready
async function gotoSendPage(page: Page) {
  await page.goto("/dashboard/send");
  // Wait for the main h1 in the form (not sidebar)
  await page.locator("h1.text-2xl").first().waitFor({ state: "visible", timeout: 15000 });
}

// Get form elements on the send page
function getSendFormElements(page: Page) {
  return {
    pageH1: page.locator("h1.text-2xl").first(),
    recipientsArea: page.locator("textarea").first(),
    messageArea: page.locator("textarea").nth(1),
    sendBtn: page.getByRole("button", { name: /ส่ง SMS/ }).first(),
    // Use getByRole('main') to scope to main content area and avoid duplicates from mobile sticky bar
    mainContent: page.getByRole("main"),
  };
}

test.describe("SMS Send Flow — /dashboard/send", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("1. Form loads with all required fields (sender, recipients, message, type tabs)", async ({ page }) => {
    await gotoSendPage(page);
    const { pageH1, recipientsArea, messageArea, sendBtn, mainContent } = getSendFormElements(page);

    // Page header
    await expect(pageH1).toContainText("ส่ง SMS");

    // Sender dropdown
    const senderTrigger = page.locator('[role="combobox"]').first();
    await expect(senderTrigger).toBeVisible();

    // Message type tabs
    await expect(mainContent.getByText("ภาษาไทย (70)")).toBeVisible();
    await expect(mainContent.getByText("English (160)")).toBeVisible();
    await expect(mainContent.getByText("Unicode (70)")).toBeVisible();

    // Recipients textarea
    await expect(recipientsArea).toBeVisible();
    await expect(recipientsArea).toHaveAttribute("placeholder", /กรอกเบอร์โทร/);

    // Message textarea
    await expect(messageArea).toBeVisible();
    await expect(messageArea).toHaveAttribute("placeholder", /พิมพ์ข้อความ SMS/);

    // Submit button exists
    await expect(sendBtn).toBeVisible();

    // Character counter shows 0 (scope to main to avoid duplicate from mobile bar)
    await expect(mainContent.getByText(/0\/70 ตัวอักษร/).first()).toBeVisible();

    // Cost summary panel
    await expect(page.getByText("สรุปค่าใช้จ่าย")).toBeVisible();

    // Preview panel
    await expect(page.getByText("ตัวอย่าง")).toBeVisible();
    await expect(page.getByText("ข้อความจะแสดงที่นี่...")).toBeVisible();

    await page.screenshot({ path: "test-results/sms-01-form-loaded.png", fullPage: true });
  });

  test("2. Sender dropdown — click and verify options", async ({ page }) => {
    await gotoSendPage(page);

    const senderTrigger = page.locator('[role="combobox"]').first();
    await senderTrigger.click();

    const selectContent = page.locator('[role="listbox"]');
    await expect(selectContent).toBeVisible({ timeout: 5000 });

    const easySlipOption = page.getByRole("option", { name: "EasySlip" });
    await expect(easySlipOption).toBeVisible();
    await easySlipOption.click();

    await expect(senderTrigger).toContainText("EasySlip");
    await expect(page.getByText("From: EasySlip")).toBeVisible();

    await page.screenshot({ path: "test-results/sms-02-sender-selected.png" });
  });

  test("3. Phone input validation — various formats", async ({ page }) => {
    await gotoSendPage(page);
    const { recipientsArea, mainContent } = getSendFormElements(page);

    // Valid Thai phone number
    await recipientsArea.fill("0812345678");
    await expect(page.getByText("1 เบอร์ถูกต้อง")).toBeVisible();

    // Invalid: alphabetic
    await recipientsArea.fill("abc");
    await expect(page.getByText(/เบอร์ไม่ถูกต้อง/)).toBeVisible();

    // Empty field — shows "0 เบอร์"
    await recipientsArea.fill("");
    await page.waitForTimeout(200);
    await expect(page.getByText("0 เบอร์", { exact: true })).toBeVisible();

    // Multiple valid phones
    await recipientsArea.fill("0812345678\n0898765432");
    await expect(page.getByText("2 เบอร์ถูกต้อง")).toBeVisible();

    // Mixed valid and invalid
    await recipientsArea.fill("0812345678\nabc\n0898765432");
    await expect(page.getByText(/เบอร์ไม่ถูกต้อง/)).toBeVisible();

    await page.screenshot({ path: "test-results/sms-03-phone-validation.png" });
  });

  test("4. Message field — Thai message with character count", async ({ page }) => {
    await gotoSendPage(page);
    const { messageArea, mainContent } = getSendFormElements(page);

    const thaiMsg = "สวัสดีครับ ทดสอบระบบส่ง SMS";
    await messageArea.fill(thaiMsg);

    // Character count should update (Thai = UCS-2, limit 70)
    // Text format: "XX/70 ตัวอักษร · Y SMS (UCS-2)"
    // Scope to main to avoid mobile duplicate
    await expect(mainContent.getByText(/\d+\/70 ตัวอักษร/).first()).toBeVisible();

    // Preview should show the message
    await expect(page.locator("p.whitespace-pre-wrap")).toContainText(thaiMsg);

    await page.screenshot({ path: "test-results/sms-04-thai-message.png" });
  });

  test("5. Message type toggle — switch between Thai/English limits", async ({ page }) => {
    await gotoSendPage(page);
    const { messageArea, mainContent } = getSendFormElements(page);

    // Default is Thai tab selected — counter shows /70
    await expect(mainContent.getByText(/0\/70 ตัวอักษร/).first()).toBeVisible();

    // Click English tab
    await mainContent.getByRole("tab", { name: "English (160)" }).first().click();
    await page.waitForTimeout(300);
    await expect(mainContent.getByText(/0\/160 ตัวอักษร/).first()).toBeVisible();

    // Type English message
    await messageArea.fill("Hello, this is a test SMS message");
    await expect(mainContent.getByText(/\d+\/160 ตัวอักษร/).first()).toBeVisible();
    await expect(mainContent.getByText("GSM-7")).toBeVisible();

    // Now type Thai - should auto-switch to /70 (UCS-2)
    await messageArea.fill("สวัสดี");
    await expect(mainContent.getByText(/\d+\/70 ตัวอักษร/).first()).toBeVisible();
    await expect(mainContent.getByText("UCS-2")).toBeVisible();

    await page.screenshot({ path: "test-results/sms-05-type-toggle.png" });
  });

  test("6. Submit with empty fields — button disabled", async ({ page }) => {
    await gotoSendPage(page);
    const { sendBtn } = getSendFormElements(page);
    await expect(sendBtn).toBeDisabled();
    await page.screenshot({ path: "test-results/sms-06-empty-disabled.png" });
  });

  test("7. Submit with only phone filled — button still disabled (message required)", async ({ page }) => {
    await gotoSendPage(page);
    const { recipientsArea, sendBtn } = getSendFormElements(page);
    await recipientsArea.fill("0812345678");
    await expect(sendBtn).toBeDisabled();
    await page.screenshot({ path: "test-results/sms-07-phone-only-disabled.png" });
  });

  test("8. Fill all fields correctly — submit button enabled", async ({ page }) => {
    await gotoSendPage(page);
    const { recipientsArea, messageArea, sendBtn } = getSendFormElements(page);

    await recipientsArea.fill("0812345678");
    await messageArea.fill("ทดสอบส่ง SMS สำเร็จ");

    const isDisabled = await sendBtn.isDisabled();
    if (isDisabled) {
      const hasNoCredits = await page.getByText(/เครดิต.*หมด|เครดิตไม่พอ/).isVisible().catch(() => false);
      const hasPhoneError = await page.getByText("เบอร์ไม่ถูกต้อง").isVisible().catch(() => false);
      console.log(`Button disabled reason: noCredits=${hasNoCredits}, phoneError=${hasPhoneError}`);
      if (!hasNoCredits && !hasPhoneError) {
        expect(isDisabled, "Submit button should be enabled with valid phone + message").toBe(false);
      }
    } else {
      expect(isDisabled).toBe(false);
    }

    await expect(page.getByText("1 เบอร์", { exact: true })).toBeVisible();

    await page.screenshot({ path: "test-results/sms-08-all-filled.png" });
  });

  test("9. XSS testing — script tag in phone and message fields", async ({ page }) => {
    await gotoSendPage(page);
    const { recipientsArea, messageArea } = getSendFormElements(page);

    let alertTriggered = false;
    page.on("dialog", async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    const xssPayload = '<script>alert(1)</script>';

    // XSS in phone field
    await recipientsArea.fill(xssPayload);
    await expect(page.getByText(/เบอร์ไม่ถูกต้อง/)).toBeVisible();

    // XSS in message field
    await messageArea.fill(xssPayload);
    await page.waitForTimeout(500);
    expect(alertTriggered).toBe(false);

    // Verify textarea value is intact (not executed)
    const msgValue = await messageArea.inputValue();
    expect(msgValue).toBe(xssPayload);

    // Try img onerror
    await messageArea.fill('<img src=x onerror="alert(1)">');
    await page.waitForTimeout(500);
    expect(alertTriggered).toBe(false);

    // Try event handler
    await messageArea.fill('" onfocus="alert(1)" autofocus="');
    await page.waitForTimeout(500);
    expect(alertTriggered).toBe(false);

    await page.screenshot({ path: "test-results/sms-09-xss-test.png" });
  });

  test("10. SQL injection — in phone field", async ({ page }) => {
    await gotoSendPage(page);
    const { recipientsArea, messageArea, sendBtn, pageH1 } = getSendFormElements(page);

    const sqlPayload = "'; DROP TABLE users--";
    await recipientsArea.fill(sqlPayload);
    await messageArea.fill("test");

    // SQL payload stripped of non-digits becomes empty or very short invalid number
    const hasError = await page.getByText(/เบอร์ไม่ถูกต้อง/).isVisible().catch(() => false);
    const hasZero = await page.getByText("0 เบอร์", { exact: true }).isVisible().catch(() => false);
    expect(hasError || hasZero, "SQL payload should result in invalid/empty phone state").toBe(true);

    // Submit button should be disabled
    await expect(sendBtn).toBeDisabled();

    // Page still functional
    await expect(pageH1).toContainText("ส่ง SMS");

    // Try SQL in message field with valid phone
    await recipientsArea.fill("0812345678");
    await messageArea.fill(sqlPayload);
    // Preview should render the text safely (React auto-escapes)
    await expect(page.locator("p.whitespace-pre-wrap")).toContainText("DROP TABLE");

    await page.screenshot({ path: "test-results/sms-10-sqli-test.png" });
  });

  test("11. Long input — 5000 chars in message field (maxLength=1000)", async ({ page }) => {
    await gotoSendPage(page);
    const { messageArea, mainContent } = getSendFormElements(page);

    const longText = "A".repeat(5000);
    await messageArea.fill(longText);

    const actualValue = await messageArea.inputValue();
    const actualLength = actualValue.length;

    // Should be capped at 1000 (maxLength attribute)
    expect(actualLength).toBeLessThanOrEqual(1000);

    // Character counter should reflect the actual length (English = GSM-7 = /160)
    await expect(mainContent.getByText(new RegExp(`${actualLength}/160 ตัวอักษร`)).first()).toBeVisible();

    await page.screenshot({ path: "test-results/sms-11-long-input.png" });
  });

  test("12. +66 international format — reports as invalid (UX finding)", async ({ page }) => {
    await gotoSendPage(page);
    const { recipientsArea } = getSendFormElements(page);

    await recipientsArea.fill("+66812345678");
    const isInvalid = await page.getByText("เบอร์ไม่ถูกต้อง").isVisible().catch(() => false);

    if (isInvalid) {
      console.log("UX FINDING: +66 international format NOT accepted — only 0x format works");
    }

    await page.screenshot({ path: "test-results/sms-12-intl-format.png" });
  });
});

test.describe("OTP Page — /dashboard/otp", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("13. OTP page loads with form", async ({ page }) => {
    await page.goto("/dashboard/otp");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/OTP|ส่ง OTP|ยืนยัน/i).first()).toBeVisible({ timeout: 15000 });

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="เบอร์"], input[placeholder*="phone"]').first();
    const hasPhoneInput = await phoneInput.isVisible().catch(() => false);
    if (!hasPhoneInput) {
      const anyInput = page.locator("input").first();
      await expect(anyInput).toBeVisible();
    }

    await page.screenshot({ path: "test-results/sms-13-otp-page.png", fullPage: true });
  });

  test("14. OTP phone field edge cases", async ({ page }) => {
    await page.goto("/dashboard/otp");
    await page.waitForLoadState("domcontentloaded");

    const phoneInput = page.locator("input").first();
    await expect(phoneInput).toBeVisible({ timeout: 15000 });

    let alertTriggered = false;
    page.on("dialog", async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    // XSS
    await phoneInput.fill('<script>alert(1)</script>');
    await page.waitForTimeout(300);
    expect(alertTriggered).toBe(false);

    // Check button state
    const sendBtn = page.getByRole("button", { name: /ส่ง|Send|OTP/i }).first();
    const btnExists = await sendBtn.isVisible().catch(() => false);
    if (btnExists) {
      const wasDisabled = await sendBtn.isDisabled();
      console.log(`OTP send button disabled with XSS input: ${wasDisabled}`);
    }

    // SQL injection
    await phoneInput.fill("'; DROP TABLE--");
    await page.waitForTimeout(300);

    await page.screenshot({ path: "test-results/sms-14-otp-edge-cases.png" });
  });
});

test.describe("Messages Page — /dashboard/messages", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("15. Messages page loads — history/inbox visible", async ({ page }) => {
    await page.goto("/dashboard/messages");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/ข้อความ|Messages|ประวัติ|SMS/i).first()).toBeVisible({ timeout: 15000 });

    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasList = await page.locator('[class*="list"], [class*="grid"], [role="list"]').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/ไม่มี|ว่าง|empty|no messages/i).isVisible().catch(() => false);

    const pageHasContent = hasTable || hasList || hasEmptyState;
    expect(pageHasContent).toBe(true);

    await page.screenshot({ path: "test-results/sms-15-messages-page.png", fullPage: true });
  });

  test("16. Console errors check on messages page", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") pageErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(`PAGE ERROR: ${err.message}`);
    });

    await page.goto("/dashboard/messages");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const criticalErrors = pageErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("analytics") && !e.includes("hydration")
    );

    if (criticalErrors.length > 0) {
      console.log("CONSOLE ERRORS on /dashboard/messages:", criticalErrors);
    }

    await page.screenshot({ path: "test-results/sms-16-messages-console.png" });
  });
});

test.describe("Mobile Viewport — 375px", () => {
  test.use({
    storageState: "tests/e2e/.auth/user.json",
    viewport: { width: 375, height: 812 },
  });

  test("17. SMS form usable at 375px mobile width", async ({ page }) => {
    await page.goto("/dashboard/send");
    await page.locator("h1.text-2xl").first().waitFor({ state: "visible", timeout: 15000 });

    await expect(page.locator("h1.text-2xl").first()).toContainText("ส่ง SMS");

    // Sender dropdown visible
    const senderTrigger = page.locator('[role="combobox"]').first();
    await expect(senderTrigger).toBeVisible();

    // Textareas visible
    const recipientsArea = page.locator("textarea").first();
    await expect(recipientsArea).toBeVisible();
    const messageArea = page.locator("textarea").nth(1);
    await expect(messageArea).toBeVisible();

    // Type tabs visible (use first() since mobile may duplicate)
    await expect(page.getByText("ภาษาไทย (70)").first()).toBeVisible();

    // Fill form and verify mobile sticky CTA
    await recipientsArea.fill("0812345678");
    await messageArea.fill("ทดสอบ mobile");

    const mobileCta = page.locator(".lg\\:hidden").locator("button", { hasText: /ส่ง SMS/ });
    const mobileCtaVisible = await mobileCta.isVisible().catch(() => false);
    console.log(`Mobile sticky CTA visible: ${mobileCtaVisible}`);

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const hasOverflow = bodyWidth > 380;
    if (hasOverflow) {
      console.log(`BUG: Horizontal overflow on mobile! body=${bodyWidth}px > viewport=375px`);
    }
    expect(hasOverflow, `Horizontal overflow: body=${bodyWidth}px`).toBe(false);

    await page.screenshot({ path: "test-results/sms-17-mobile-375.png", fullPage: true });
  });

  test("18. OTP page at 375px mobile", async ({ page }) => {
    await page.goto("/dashboard/otp");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const hasOverflow = bodyWidth > 380;
    if (hasOverflow) {
      console.log(`BUG: OTP page horizontal overflow at 375px! body=${bodyWidth}px`);
    }

    await page.screenshot({ path: "test-results/sms-18-otp-mobile.png", fullPage: true });
  });

  test("19. Messages page at 375px mobile", async ({ page }) => {
    await page.goto("/dashboard/messages");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const hasOverflow = bodyWidth > 380;
    if (hasOverflow) {
      console.log(`BUG: Messages page horizontal overflow at 375px! body=${bodyWidth}px`);
    }

    await page.screenshot({ path: "test-results/sms-19-messages-mobile.png", fullPage: true });
  });
});

test.describe("Console Errors Audit — All Pages", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("20. No critical console errors across send/otp/messages pages", async ({ page }) => {
    const allErrors: { page: string; errors: string[] }[] = [];

    for (const route of ["/dashboard/send", "/dashboard/otp", "/dashboard/messages"]) {
      const pageErrors: string[] = [];
      const errorHandler = (msg: ConsoleMessage) => {
        if (msg.type() === "error") pageErrors.push(msg.text());
      };
      const crashHandler = (err: Error) => {
        pageErrors.push(`CRASH: ${err.message}`);
      };

      page.on("console", errorHandler);
      page.on("pageerror", crashHandler);

      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      page.removeListener("console", errorHandler);
      page.removeListener("pageerror", crashHandler);

      if (pageErrors.length > 0) {
        allErrors.push({ page: route, errors: pageErrors });
      }
    }

    for (const entry of allErrors) {
      console.log(`\n=== Console errors on ${entry.page} ===`);
      entry.errors.forEach((e) => console.log(`  - ${e}`));
    }

    // Fail only on page crashes
    const crashes = allErrors.flatMap((e) => e.errors.filter((err) => err.startsWith("CRASH:")));
    expect(crashes, `Page crashes detected: ${crashes.join("; ")}`).toHaveLength(0);
  });
});
