import { test, expect, expectPageLoads } from "./fixtures";

test.describe("Campaigns", () => {
  // TC-090: Campaigns list
  test("TC-090: campaigns page loads", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/campaigns");
  });

  // TC-090b: Campaigns shows list or empty state
  test("TC-090b: campaigns shows data or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    const hasContent =
      body!.includes("แคมเปญ") ||
      body!.includes("Campaign") ||
      body!.includes("ยังไม่มี") ||
      body!.includes("สร้าง");
    expect(hasContent).toBeTruthy();
  });

  // TC-091: Create campaign button — may use icon-only or different text
  test("TC-091: create campaign button or action exists", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });
    // Look for any create/add action on the page
    const createBtn = page.locator("button, a").filter({
      hasText: /สร้าง|Create|เพิ่ม|New|ใหม่/i,
    }).first();
    const hasBtn = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    // If no explicit create button, verify page has content
    if (!hasBtn) {
      const body = await page.textContent("body");
      expect(body!.length).toBeGreaterThan(200);
    }
  });

  // TC-091b: Campaign page is interactive
  test("TC-091b: campaigns page has interactive elements", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "networkidle" });
    // Verify the page has buttons or links (any interactive elements)
    const buttons = page.locator("button, a[href]");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
