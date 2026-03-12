import { test, expect, expectPageLoads } from "./fixtures";

test.describe("Contacts", () => {
  // TC-070: Contacts list
  test("TC-070: contacts page shows data table", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/contacts");
    const table = page.locator("table");
    await expect(table).toBeVisible();
    const rows = table.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be empty, but table exists
  });

  // TC-071: Add contact button
  test("TC-071: add contact button exists", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts", { waitUntil: "networkidle" });
    const addBtn = page.locator("button").filter({
      hasText: /เพิ่ม|Add|Quick|สร้าง/i,
    }).first();
    await expect(addBtn).toBeVisible();
  });

  // TC-072: Search contacts
  test("TC-072: search input exists and accepts input", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts", { waitUntil: "networkidle" });
    const search = page.locator('input[type="search"], input[placeholder*="ค้น"], input[placeholder*="search"], input[placeholder*="Search"]').first();
    await expect(search).toBeVisible();
    await search.fill("test");
    // Verify input accepted the text
    await expect(search).toHaveValue("test");
  });

  // TC-073: Checkbox selection
  test("TC-073: contact rows have checkboxes", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts", { waitUntil: "networkidle" });
    const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  // TC-074: Contact groups
  test("TC-074: groups page loads", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/contacts/groups");
  });

  // TC-075: Tags page
  test("TC-075: tags page loads", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/tags");
  });
});
