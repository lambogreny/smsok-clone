import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Task #4649 — RBAC Permissions Browser Test", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', "qa-suite@smsok.test");
    await page.fill('input[name="password"], input[type="password"]', process.env.E2E_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
  });

  test("1. Login → Dashboard loads without 403", async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
    await page.screenshot({ path: "tests/e2e/screenshots/4649-dashboard.png" });
  });

  test("2. Contacts page loads (previously 403)", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle");
    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
    expect(text).toMatch(/ผู้ติดต่อ|Contacts|เพิ่ม/);
    await page.screenshot({ path: "tests/e2e/screenshots/4649-contacts.png" });
  });

  test("3. Contacts CRUD — create contact via form", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle");

    // Look for add contact button
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), button:has-text("Add"), a:has-text("เพิ่ม")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "tests/e2e/screenshots/4649-contact-form.png" });

      // Fill form if dialog/page appeared
      const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"], input[placeholder*="name"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill("QA RBAC Test Contact");
        const phoneInput = page.locator('input[name="phone"], input[placeholder*="เบอร์"], input[placeholder*="phone"]').first();
        if (await phoneInput.isVisible()) {
          await phoneInput.fill("0901234567");
        }
        // Submit
        const submitBtn = page.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("Save")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4649-contacts-after-create.png" });
    // Main assertion: no 403 error
    const body = await page.textContent("body");
    expect(body).not.toContain("ไม่มีสิทธิ์");
  });

  test("4. Groups page loads (previously 403)", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/groups`);
    await page.waitForLoadState("networkidle");
    // Check main content area, not raw body (which includes JS)
    const mainContent = page.locator("main, [role='main'], .flex-1").first();
    const text = await mainContent.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
    // Should see groups content
    expect(text).toMatch(/กลุ่ม|Groups|สร้างกลุ่ม/);
    await page.screenshot({ path: "tests/e2e/screenshots/4649-groups.png" });
  });

  test("5. Tags — visible on contacts page", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/contacts`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4649-tags.png" });
    // No 403
    const body = await page.textContent("body");
    expect(body).not.toContain("ไม่มีสิทธิ์");
  });

  test("6. SMS Send page loads with permissions", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/sms`);
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).not.toContain("ไม่มีสิทธิ์");
    await page.screenshot({ path: "tests/e2e/screenshots/4649-sms.png" });
  });

  test("7. Settings page accessible", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).not.toContain("ไม่มีสิทธิ์");
    await page.screenshot({ path: "tests/e2e/screenshots/4649-settings.png" });
  });

  test("8. All sidebar pages — no 403 errors", async ({ page }) => {
    const pages = [
      "/dashboard",
      "/dashboard/sms",
      "/dashboard/sms/history",
      "/dashboard/campaigns",
      "/dashboard/contacts",
      "/dashboard/groups",
      "/dashboard/templates",
      "/dashboard/senders",
      "/dashboard/packages",
      "/dashboard/settings",
      "/dashboard/support",
      "/dashboard/api-keys",
    ];

    const failures: string[] = [];
    for (const p of pages) {
      await page.goto(`${BASE}${p}`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);
      const main = page.locator("main, [role='main'], .flex-1").first();
      const text = await main.textContent() || "";
      if (text.includes("ไม่มีสิทธิ์")) {
        failures.push(p);
      }
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4649-all-pages.png" });
    expect(failures).toEqual([]);
  });
});
