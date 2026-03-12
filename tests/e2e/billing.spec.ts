import { test, expect, expectPageLoads } from "./fixtures";

test.describe("Billing & Credits", () => {
  // TC-060: Billing page loads
  test("TC-060: billing page loads", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/billing");
  });

  // TC-061: Transaction list or empty state
  test("TC-061: billing shows transactions or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    // Should have transaction-related text
    const hasContent =
      body!.includes("รายการ") ||
      body!.includes("Transaction") ||
      body!.includes("ประวัติ") ||
      body!.includes("ยังไม่มี") ||
      body!.includes("ชำระเงิน");
    expect(hasContent).toBeTruthy();
  });

  // TC-062: Invoice section
  test("TC-062: billing page has invoice section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    const hasInvoice =
      body!.includes("ใบกำกับ") ||
      body!.includes("Invoice") ||
      body!.includes("ใบแจ้ง") ||
      body!.includes("เอกสาร");
    expect(hasInvoice).toBeTruthy();
  });

  // TC-063: Credit balance display
  test("TC-063: credits page shows balance", async ({ authedPage: page }) => {
    await page.goto("/dashboard/credits", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).not.toContain("Something went wrong");
    // Should show SMS count
    expect(body).toMatch(/[\d,]+\s*SMS/i);
  });

  // TC-064: Topup/Buy button
  test("TC-064: credits page has topup button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/credits", { waitUntil: "networkidle" });
    const buyBtn = page.locator("button, a").filter({
      hasText: /เติม|ซื้อ|Topup|Buy|แพ็กเกจ/i,
    }).first();
    await expect(buyBtn).toBeVisible();
  });

  // TC-065: Sidebar shows credit count
  test("TC-065: sidebar displays SMS credit count", async ({ authedPage: page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const smsText = page.locator("text=/[\\d,]+\\s*SMS/i").first();
    await expect(smsText).toBeVisible({ timeout: 10000 });
  });
});
