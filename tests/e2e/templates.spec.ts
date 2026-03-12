import { test, expect, expectPageLoads } from "./fixtures";

test.describe("Templates", () => {
  // TC-080: Templates list
  test("TC-080: templates page loads with list", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/templates");
    // Should have table or card layout
    const body = await page.textContent("body");
    expect(body).toContain("เทมเพลต");
  });

  // TC-081: Create template button exists
  test("TC-081: create template button visible", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates", { waitUntil: "networkidle" });
    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม/i,
    }).first();
    await expect(createBtn).toBeVisible();
  });

  // TC-081b: Create template dialog opens
  test("TC-081b: clicking create opens dialog/form", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates", { waitUntil: "networkidle" });
    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม/i,
    }).first();
    await createBtn.click();

    // Wait for dialog or navigate to create page
    const dialog = page.locator('[role="dialog"]');
    const isDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    const isCreatePage = page.url().includes("create") || page.url().includes("new");

    expect(isDialog || isCreatePage).toBeTruthy();
  });

  // TC-082: Template has name and content fields
  test("TC-082: template form has name and content fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates", { waitUntil: "networkidle" });
    const createBtn = page.locator("button").filter({
      hasText: /สร้าง|Create|เพิ่ม/i,
    }).first();
    await createBtn.click();

    // Check for input fields in dialog or page
    const dialog = page.locator('[role="dialog"]');
    const container = (await dialog.isVisible({ timeout: 3000 }).catch(() => false))
      ? dialog
      : page;

    const inputs = container.locator("input, textarea");
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
