import { test, expect, expectPageLoads } from "./fixtures";

test.describe("OTP Service", () => {
  // TC-040: OTP page loads
  test("TC-040: OTP page loads with form", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/otp");
    // Should have input/form elements
    const inputs = page.locator('input, textarea, [role="combobox"]');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  // TC-041: OTP send button exists
  test("TC-041: OTP page has send button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/otp", { waitUntil: "networkidle" });
    const sendBtn = page.locator("button").filter({
      hasText: /ส่ง|Send|OTP/i,
    }).first();
    await expect(sendBtn).toBeVisible();
  });

  // TC-041b: OTP page shows service info
  test("TC-041b: OTP page displays service information", async ({ authedPage: page }) => {
    await page.goto("/dashboard/otp", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    const hasOTPContent =
      body!.includes("OTP") ||
      body!.includes("ยืนยัน") ||
      body!.includes("verify");
    expect(hasOTPContent).toBeTruthy();
  });
});
