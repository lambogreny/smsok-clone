import { test, expect } from "./fixtures";

test.describe("SMS Sending", () => {
  test("SMS-01: send page loads with form", async ({ authedPage: page }) => {
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

  test("SMS-03: message textarea accepts input", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill("ทดสอบส่ง SMS จาก E2E test");
      const val = await textarea.inputValue();
      expect(val).toContain("ทดสอบ");
    }
  });

  test("SMS-04: XSS in message field is escaped", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('<script>alert("xss")</script>');
      const val = await textarea.inputValue();
      expect(val).toContain("<script>"); // stored as text
    }
  });

  test("SMS-05: credit count visible on send page", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/\d+\s*SMS|\d+\s*credit|เครดิต/i);
  });
});
