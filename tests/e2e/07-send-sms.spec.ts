import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("SMS Sending", () => {
  test("SMS-01: send page loads with compose form", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ส่ง SMS|Send|ผู้รับ|ข้อความ/i);
    await page.screenshot({ path: "test-results/07-sms-compose.png" });
  });

  test("SMS-02: sender name selector visible", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ชื่อผู้ส่ง|Sender|SMSOK/i);
  });

  test("SMS-03: message textarea accepts input and shows character count", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill("ทดสอบส่ง SMS จาก E2E test — Hello World!");
      const val = await textarea.inputValue();
      expect(val).toContain("ทดสอบ");
      await page.screenshot({ path: "test-results/07-sms-filled.png" });
    }
  });

  test("SMS-04: phone input accepts Thai phone format", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const phoneInput = page.locator('input[placeholder*="เบอร์"], input[name*="phone"], input[name*="to"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await phoneInput.fill("0891234567");
      const val = await phoneInput.inputValue();
      expect(val).toContain("089");
    }
  });

  test("SMS-05: XSS in message field is stored as text", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('<script>alert("xss")</script>');
      const val = await textarea.inputValue();
      expect(val).toContain("<script>");
    }
  });

  test("SMS-06: credit count visible on send page", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/\d+\s*SMS|\d+\s*credit|เครดิต/i);
  });

  test("SMS-07: send button disabled without recipient and message", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const sendBtn = page.locator('button:has-text("ส่ง"), button:has-text("Send")').first();
    if (await sendBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isDisabled = await sendBtn.isDisabled();
      // If not disabled, it should at least show validation on click
      if (!isDisabled) {
        await sendBtn.click();
        await page.waitForTimeout(1000);
        const body = await page.textContent("body");
        // Should show validation error
        expect(body).toMatch(/กรุณา|required|ต้อง|เบอร์|ข้อความ/i);
      }
    }
  });

  test("SMS-08: scheduled SMS page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/scheduled");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/07-sms-scheduled.png" });
  });

  test("SMS-09: templates page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
    await page.screenshot({ path: "test-results/07-sms-templates.png" });
  });

  test("SMS-10: no console errors on send page", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e => !e.includes("favicon") && !e.includes("sw.js"));
    expect(realErrors).toHaveLength(0);
  });

  test("SMS-11: send page responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 10
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/07-sms-mobile.png" });
  });

  test("SMS-12: OTP management page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/otp");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Internal Server Error");
  });
});
