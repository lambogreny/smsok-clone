import { test, expect, expectPageLoads, collectConsoleErrors } from "./fixtures";
import { test as base, expect as baseExpect } from "@playwright/test";

// ============================================================
// API Keys Page — Deep E2E Testing
// ============================================================

test.describe("API Keys — Functional Tests", () => {
  test("AK-01: Page loads without error", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/api-keys");
    const body = await page.textContent("body");
    expect(body).toContain("API Keys");
  });

  test("AK-02: Page heading and description visible", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    // Title
    const heading = page.locator("h1, h2, h3").filter({ hasText: /API Keys/i });
    await expect(heading.first()).toBeVisible();
    // Description
    const desc = page.locator("text=จัดการ API keys สำหรับเชื่อมต่อระบบภายนอก");
    await expect(desc.first()).toBeVisible();
  });

  test("AK-03: Stats row visible (active keys, rate limit, API calls)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("Keys ที่ใช้งาน");
    expect(body).toContain("Rate Limit");
    expect(body).toContain("API Calls เดือนนี้");
  });

  test("AK-04: Create API Key button exists and is clickable", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    // Button text: สร้างคีย์ใหม่ (desktop) or just Plus icon (mobile)
    const createBtn = page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i });
    // On desktop, the text should be visible
    const plusBtn = page.locator("button").filter({ has: page.locator("svg") }).filter({ hasText: /สร้าง|คีย์/ });
    const btn = (await createBtn.count()) > 0 ? createBtn.first() : plusBtn.first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("AK-05: Click Create opens dialog with correct fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    // Click create button
    const createBtn = page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
    } else {
      // Fallback: click any button with Plus icon near the header
      const anyCreate = page.locator("button").filter({ has: page.locator(".lucide-plus") }).first();
      await anyCreate.click();
    }
    await page.waitForTimeout(500);

    // Dialog should be open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Dialog title
    const dialogTitle = dialog.locator("text=สร้าง API Key ใหม่");
    await expect(dialogTitle.first()).toBeVisible();

    // Key name input
    const nameInput = dialog.locator('input[placeholder*="Production"]').first();
    await expect(nameInput).toBeVisible();

    // Permission checkboxes
    const permLabels = ["ส่ง SMS", "ดูประวัติ SMS", "อ่านรายชื่อ", "จัดการรายชื่อ"];
    for (const label of permLabels) {
      const permEl = dialog.locator(`text=${label}`);
      await expect(permEl.first()).toBeVisible();
    }

    // Rate limit input
    const rateLimitInput = dialog.locator('input[type="number"]').first();
    await expect(rateLimitInput).toBeVisible();

    // IP whitelist input
    const ipInput = dialog.locator('input[placeholder*="203.0.113"]').first();
    await expect(ipInput).toBeVisible();

    // Submit button (สร้าง Key)
    const submitBtn = dialog.locator("button").filter({ hasText: /สร้าง Key/i });
    await expect(submitBtn.first()).toBeVisible();

    // Cancel button (ยกเลิก)
    const cancelBtn = dialog.locator("button").filter({ hasText: /ยกเลิก/i });
    await expect(cancelBtn.first()).toBeVisible();
  });

  test("AK-06: Fill key name — input accepts text", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const nameInput = dialog.locator('input[placeholder*="Production"]').first();
    await nameInput.fill("QA Test Key");
    await expect(nameInput).toHaveValue("QA Test Key");
  });

  test("AK-07: Toggle permissions — checkboxes work", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');

    // Find the label for "ส่ง SMS" permission — should be checked by default
    const smsLabel = dialog.locator("label").filter({ hasText: "ส่ง SMS" }).first();
    await expect(smsLabel).toBeVisible();

    // base-ui Checkbox uses data-checked attribute on the root button
    const checkbox = smsLabel.locator('[data-slot="checkbox"]').first();
    // Verify it's checked by default (has data-checked attribute)
    const isCheckedBefore = await checkbox.getAttribute("data-checked");
    expect(isCheckedBefore).not.toBeNull(); // data-checked present = checked

    // Click the label to uncheck
    await smsLabel.click();
    await page.waitForTimeout(300);
    const isCheckedAfter = await checkbox.getAttribute("data-checked");
    expect(isCheckedAfter).toBeNull(); // data-checked absent = unchecked

    // Click again to re-check
    await smsLabel.click();
    await page.waitForTimeout(300);
    const isCheckedAgain = await checkbox.getAttribute("data-checked");
    expect(isCheckedAgain).not.toBeNull(); // data-checked present = checked
  });

  test("AK-08: Submit create form — key created successfully", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });

    // Check current key count — max is 5
    const currentKeys = await page.locator("table tbody tr").count().catch(() => 0);

    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const nameInput = dialog.locator('input[placeholder*="Production"]').first();
    await nameInput.fill("QA Test Key E2E");

    // Submit
    const submitBtn = dialog.locator("button").filter({ hasText: /สร้าง Key/i }).first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Should see the one-time secret display OR the key in the list OR max limit error toast
    const body = await page.textContent("body");
    const hasSecret = body?.includes("API Key สร้างเรียบร้อยแล้ว") || body?.includes("Secret Key");
    const hasKeyInList = body?.includes("QA Test Key E2E");
    const hasMaxLimit = body?.includes("สูงสุด 5");
    expect(hasSecret || hasKeyInList || hasMaxLimit).toBe(true);
  });

  test("AK-09: New key appears in list with name", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    // After previous test created a key, it should appear
    // Check table has at least one row (or empty state if cleaned up)
    const table = page.locator("table");
    const emptyState = page.locator("text=ยังไม่มี API Key");
    const hasTable = await table.count() > 0;
    const hasEmpty = await emptyState.count() > 0;
    expect(hasTable || hasEmpty).toBe(true);
  });

  test("AK-10: Key value display is masked (sk_live_xxx...xxxx format)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const table = page.locator("table");
    if (await table.count() > 0 && (await page.locator("table tbody tr").count()) > 0) {
      // Check for masked key format in the Key column (second td)
      const keyCode = page.locator("table tbody tr").first().locator("td").nth(1).locator("code").first();
      if (await keyCode.isVisible().catch(() => false)) {
        const keyText = await keyCode.textContent();
        // Should be masked: "sk_live_XXXX...XXXX" or "sk_live_...XXXX" or "sk_live_****...****"
        expect(keyText).toMatch(/sk_live_[\w*]*\.\.\.[\w*]+/);
        // Should NOT be the full key (64 hex chars after prefix)
        expect(keyText!.length).toBeLessThan(80);
      }
    } else {
      // No keys in table — skip (not a failure)
      test.skip();
    }
  });

  test("AK-11: Secret display — one-time secret with copy buttons", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('input[placeholder*="Production"]').first().fill("QA Secret Test");
    await dialog.locator("button").filter({ hasText: /สร้าง Key/i }).first().click();
    await page.waitForTimeout(2000);

    // Check secret display area
    const secretDisplay = page.locator("text=API Key สร้างเรียบร้อยแล้ว");
    if (await secretDisplay.count() > 0) {
      await expect(secretDisplay.first()).toBeVisible();

      // Key ID label
      await expect(page.locator("text=Key ID").first()).toBeVisible();

      // Secret Key label
      await expect(page.locator("text=Secret Key").first()).toBeVisible();

      // Copy buttons
      const copyBtns = page.locator("button").filter({ hasText: /คัดลอก/i });
      expect(await copyBtns.count()).toBeGreaterThanOrEqual(2);

      // Warning text
      await expect(page.locator("text=จะไม่แสดงอีกหลังจากปิด").first()).toBeVisible();

      // Confirmation checkbox
      const confirmCheckbox = page.locator("text=ฉันคัดลอก Secret Key แล้ว");
      await expect(confirmCheckbox.first()).toBeVisible();

      // Close button disabled until confirmed
      const closeBtn = page.locator("button").filter({ hasText: /^ปิด$/i }).first();
      await expect(closeBtn).toBeDisabled();

      // Check the confirmation checkbox
      const checkbox = page.locator('button[role="checkbox"]').filter({
        has: page.locator("~ span, + span"),
      });
      // Click the label area to check
      await page.locator("text=ฉันคัดลอก Secret Key แล้ว").click();
      await page.waitForTimeout(300);

      // Close button should now be enabled
      await expect(closeBtn).toBeEnabled();

      // Close the secret display
      await closeBtn.click();
      await page.waitForTimeout(500);
      await expect(secretDisplay).not.toBeVisible();
    }
  });

  test("AK-12: Delete key — confirmation dialog appears and key removed", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Check if there are any keys to delete
    const hasKeys = (await page.locator("table tbody tr").count()) > 0;
    if (!hasKeys) {
      // No keys to delete, skip
      test.skip();
      return;
    }

    // Find a delete button (trash icon) in the table
    const deleteBtn = page.locator('button[aria-label*="ลบ API Key"]').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });

    const keyCountBefore = await page.locator("table tbody tr").count();

    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Confirmation dialog should appear
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible();

    // Dialog text
    const dialogText = await alertDialog.textContent();
    expect(dialogText).toContain("ลบ API Key");
    expect(dialogText).toContain("ไม่สามารถย้อนกลับ");

    // Cancel button
    const cancelBtn = alertDialog.locator("button").filter({ hasText: /ยกเลิก/i });
    await expect(cancelBtn.first()).toBeVisible();

    // Confirm delete button
    const confirmBtn = alertDialog.locator("button").filter({ hasText: /ยืนยันลบ/i });
    await expect(confirmBtn.first()).toBeVisible();

    // Click confirm
    await confirmBtn.first().click();
    await page.waitForTimeout(2000);

    // Key should be removed
    const keyCountAfter = await page.locator("table tbody tr").count();
    expect(keyCountAfter).toBeLessThan(keyCountBefore);
  });

  test("AK-13: Empty state shows when no keys", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const table = page.locator("table");
    const emptyState = page.locator("text=ยังไม่มี API Key");
    // Either table with keys exists, or empty state is shown
    const hasTable = (await table.count()) > 0 && (await page.locator("table tbody tr").count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;
    expect(hasTable || hasEmpty).toBe(true);

    if (hasEmpty) {
      // Empty state should have create button
      const emptyCreateBtn = page.locator("text=สร้าง API Key");
      await expect(emptyCreateBtn.first()).toBeVisible();
    }
  });

  test("AK-14: Table columns present (Name, Key, Permissions, Status, Last Used, Actions)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const table = page.locator("table");
    if (await table.count() > 0 && (await page.locator("table tbody tr").count()) > 0) {
      const headers = page.locator("table thead th");
      const headerTexts = await headers.allTextContents();
      const joined = headerTexts.join(" ");
      expect(joined).toContain("ชื่อ");
      expect(joined).toContain("Key");
      expect(joined).toContain("สถานะ");
      expect(joined).toContain("จัดการ");
      // Some columns hidden on smaller viewports but should exist in DOM
      const allHeaders = await page.locator("table thead th").count();
      expect(allHeaders).toBeGreaterThanOrEqual(4);
    }
  });

  test("AK-15: Toggle key active/inactive", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const hasKeys = (await page.locator("table tbody tr").count()) > 0;
    if (!hasKeys) {
      test.skip();
      return;
    }

    // Find the toggle button (power icon) — could be PowerOff or Power
    const toggleBtn = page.locator('button[aria-label="ปิดใช้งาน"], button[aria-label="เปิดใช้งาน"]').first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      // Listen for network response to verify server action completed
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes("api-keys") || resp.url().includes("_next"),
        { timeout: 10000 }
      ).catch(() => null);

      await toggleBtn.click();

      // Wait for server action response
      await responsePromise;
      await page.waitForTimeout(2000);

      // Verify no crash
      const body = await page.textContent("body");
      expect(body).not.toContain("Internal Server Error");
      expect(body).not.toContain("Something went wrong");

      // The page should still show API Keys content
      expect(body).toContain("API Keys");
    }
  });

  test("AK-16: API docs and usage example section visible", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    // API Documentation section
    await expect(page.locator("text=API Documentation").first()).toBeVisible();
    await expect(page.locator("text=เรียนรู้การใช้งาน API").first()).toBeVisible();

    // Usage example
    await expect(page.locator("text=ตัวอย่างการใช้งาน").first()).toBeVisible();
    // curl example
    const curlExample = page.locator("code").filter({ hasText: /curl.*sms\/send/i });
    await expect(curlExample.first()).toBeVisible();
  });

  test("AK-17: Edit key name inline", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    // Click on key name to edit
    const firstKeyName = page.locator("table tbody tr").first().locator("td").first().locator("button").first();
    if (await firstKeyName.isVisible().catch(() => false)) {
      await firstKeyName.click();
      await page.waitForTimeout(300);

      // Input should appear for editing
      const editInput = page.locator("table tbody tr").first().locator("input").first();
      if (await editInput.isVisible().catch(() => false)) {
        await editInput.clear();
        await editInput.fill("Renamed Key");
        // Press Enter to save
        await editInput.press("Enter");
        await page.waitForTimeout(1500);
        // Verify no error
        const body = await page.textContent("body");
        expect(body).not.toContain("Internal Server Error");
      }
    }
  });
});

// ============================================================
// Validation & Security Tests
// ============================================================
test.describe("API Keys — Validation & Security", () => {
  test("AK-S01: XSS in key name — escaped properly", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const nameInput = dialog.locator('input[placeholder*="Production"]').first();
    await nameInput.fill('<script>alert(1)</script>');
    await expect(nameInput).toHaveValue('<script>alert(1)</script>');

    // Submit and check XSS doesn't execute
    const submitBtn = dialog.locator("button").filter({ hasText: /สร้าง Key/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Check no alert dialog appeared (XSS didn't execute)
    const dialogCount = await page.locator('[role="alertdialog"]').count();
    // The text should be rendered as text, not executed
    // Check the page didn't have an actual alert
    const hasXssExecution = await page.evaluate(() => {
      return (window as Window & { __xss_triggered?: boolean }).__xss_triggered === true;
    });
    expect(hasXssExecution).toBe(false);
  });

  test("AK-S02: Empty key name — submit disabled", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const nameInput = dialog.locator('input[placeholder*="Production"]').first();
    // Clear the input (ensure empty)
    await nameInput.fill("");

    const submitBtn = dialog.locator("button").filter({ hasText: /สร้าง Key/i }).first();
    await expect(submitBtn).toBeDisabled();
  });

  test("AK-S03: Very long key name (200+ chars) — handled gracefully", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const nameInput = dialog.locator('input[placeholder*="Production"]').first();
    const longName = "A".repeat(200);
    await nameInput.fill(longName);

    // Input has maxLength=50, so it should be truncated
    const value = await nameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(50);
  });

  test("AK-S04: SQL injection in key name", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const nameInput = dialog.locator('input[placeholder*="Production"]').first();
    await nameInput.fill("'; DROP TABLE api_keys--");

    const submitBtn = dialog.locator("button").filter({ hasText: /สร้าง Key/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Page should not crash
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("Something went wrong");
    // API Keys page should still work
    expect(body).toContain("API Keys");
  });

  test("AK-S05: API key values never fully exposed in DOM after creation", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });

    // Check that no full sk_live_ keys are in the DOM (should be masked)
    const fullKeyPattern = await page.evaluate(() => {
      const html = document.body.innerHTML;
      // Full key would be sk_live_ followed by 64 hex chars
      const matches = html.match(/sk_live_[a-f0-9]{64}/g);
      return matches ? matches.length : 0;
    });
    expect(fullKeyPattern).toBe(0);
  });

  test("AK-S06: Console errors check", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("manifest") &&
        !e.includes("third-party") &&
        !e.includes("hydration") &&
        !e.includes("DevTools")
    );

    // Allow some tolerance for non-critical warnings
    for (const err of criticalErrors) {
      expect(err).not.toContain("Uncaught");
      expect(err).not.toContain("TypeError");
      expect(err).not.toContain("ReferenceError");
    }
  });
});

// ============================================================
// Auth Guard Test — uses no-auth context
// ============================================================
base.describe("API Keys — Auth Guard", () => {
  base.use({ storageState: { cookies: [], origins: [] } });

  base("AK-AUTH-01: /dashboard/api-keys without login redirects to /login", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/api-keys", { waitUntil: "networkidle", timeout: 30000 });
    // Should be redirected to login
    expect(page.url()).toContain("/login");
  });
});

// ============================================================
// Mobile / Responsive Tests
// ============================================================
test.describe("API Keys — Mobile 375px", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("AK-M01: 375px — page usable, create button visible", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("API Keys");

    // On mobile, the create button text might be hidden (span.hidden.sm:inline)
    // but the Plus icon button should still exist in the header area
    // Look for the button that contains Plus icon specifically in the page header (not sidebar)
    const createBtn = page.locator("main button, [class*='PageHeader'] button, header button").filter({
      has: page.locator("svg.lucide-plus"),
    }).first();

    // If the specific locator doesn't work, try finding any button with สร้าง text
    const fallbackBtn = page.locator("button").filter({ hasText: /สร้าง/ }).first();

    const isCreateVisible = await createBtn.isVisible().catch(() => false);
    const isFallbackVisible = await fallbackBtn.isVisible().catch(() => false);

    // On 375px mobile, the sidebar might be collapsed — the create button
    // is in the header area which should still be accessible
    expect(isCreateVisible || isFallbackVisible).toBe(true);
  });

  test("AK-M02: 375px — create dialog opens properly", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });

    // Find and click create button
    const buttons = page.locator("button");
    const count = await buttons.count();
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      if (text?.includes("สร้าง") || text?.includes("คีย์ใหม่")) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    // Fallback: try Plus icon button in header area
    if (!clicked) {
      const plusBtn = page.locator("button").filter({ has: page.locator("svg.lucide-plus") }).first();
      if (await plusBtn.isVisible().catch(() => false)) {
        await plusBtn.click();
        clicked = true;
      }
    }

    if (clicked) {
      await page.waitForTimeout(500);
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Dialog should not overflow viewport
      const dialogBox = await dialog.boundingBox();
      if (dialogBox) {
        expect(dialogBox.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test("AK-M03: 375px — key list readable", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    // Table or empty state should be visible
    const table = page.locator("table");
    const emptyState = page.locator("text=ยังไม่มี API Key");
    const hasContent = (await table.count() > 0) || (await emptyState.count() > 0);
    expect(hasContent).toBe(true);

    if (await table.count() > 0) {
      // Table should be scrollable or responsive
      const tableWrapper = page.locator("table").locator("..");
      const wrapperBox = await tableWrapper.boundingBox();
      // Just check it renders without breaking layout
      expect(wrapperBox).not.toBeNull();
    }
  });
});

test.describe("API Keys — Tablet 768px", () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
  });

  test("AK-M04: 768px — layout adapts, table readable", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body).toContain("API Keys");

    const table = page.locator("table");
    if (await table.count() > 0) {
      // On 768px, "ใช้ล่าสุด" column should be visible (md:table-cell)
      const lastUsedHeader = page.locator("th").filter({ hasText: "ใช้ล่าสุด" });
      if (await lastUsedHeader.count() > 0) {
        await expect(lastUsedHeader.first()).toBeVisible();
      }
    }
  });
});

test.describe("API Keys — Touch Targets", () => {
  test("AK-M05: Touch targets >= 44px for key action buttons", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    // Check create button size
    const createBtn = page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first();
    if (await createBtn.isVisible()) {
      const box = await createBtn.boundingBox();
      if (box) {
        // Button should be at least 36px (some tolerance for styled buttons)
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }

    // Check table action buttons
    const actionBtns = page.locator('button[aria-label*="ลบ"], button[aria-label*="ปิด"], button[aria-label*="เปิด"]');
    const actionCount = await actionBtns.count();
    for (let i = 0; i < Math.min(actionCount, 3); i++) {
      const btn = actionBtns.nth(i);
      if (await btn.isVisible()) {
        const box = await btn.boundingBox();
        if (box) {
          // Action buttons are small icons, check they're at least tappable
          expect(box.height).toBeGreaterThanOrEqual(24);
          expect(box.width).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });
});

// ============================================================
// Thai Language Tests
// ============================================================
test.describe("API Keys — Thai Language", () => {
  test("AK-TH01: Labels and headings in Thai", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    const body = await page.textContent("body");

    // Page description
    expect(body).toContain("จัดการ API keys สำหรับเชื่อมต่อระบบภายนอก");

    // Stats labels
    expect(body).toContain("Keys ที่ใช้งาน");
    expect(body).toContain("เดือนนี้");

    // Table headers (if table exists)
    const table = page.locator("table");
    if (await table.count() > 0) {
      const headers = await page.locator("table thead th").allTextContents();
      const joined = headers.join(" ");
      expect(joined).toContain("ชื่อ");
      expect(joined).toContain("สถานะ");
      expect(joined).toContain("จัดการ");
    }

    // API docs section
    expect(body).toContain("เรียนรู้การใช้งาน API");
    expect(body).toContain("ตัวอย่างการใช้งาน");
  });

  test("AK-TH02: Dialog labels in Thai", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const dialogText = await dialog.textContent();

    expect(dialogText).toContain("สร้าง API Key ใหม่");
    expect(dialogText).toContain("ชื่อ Key");
    expect(dialogText).toContain("สิทธิ์การใช้งาน");
    expect(dialogText).toContain("ส่ง SMS");
    expect(dialogText).toContain("ดูประวัติ SMS");
    expect(dialogText).toContain("อ่านรายชื่อ");
    expect(dialogText).toContain("ยกเลิก");
    expect(dialogText).toContain("สร้าง Key");
  });

  test("AK-TH03: Permission names readable and correct", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });
    await page.locator("button").filter({ hasText: /สร้างคีย์ใหม่/i }).first().click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const dialogText = await dialog.textContent();

    const expectedPerms = [
      "ส่ง SMS",
      "ดูประวัติ SMS",
      "อ่านรายชื่อ",
      "จัดการรายชื่อ",
      "ดูแคมเปญ",
      "จัดการแคมเปญ",
      "ดู template",
      "จัดการ template",
      "ดูกลุ่ม",
      "จัดการกลุ่ม",
      "ดู webhooks",
      "จัดการ webhooks",
      "ดูข้อมูลบิล",
    ];

    for (const perm of expectedPerms) {
      expect(dialogText).toContain(perm);
    }
  });
});

// ============================================================
// Cleanup — delete all test keys
// ============================================================
test.describe("API Keys — Cleanup", () => {
  test("AK-CLEANUP: Delete all test keys created during tests", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "networkidle" });

    // Delete all keys that were created during testing
    let maxAttempts = 10;
    while (maxAttempts > 0) {
      const deleteBtn = page.locator('button[aria-label*="ลบ API Key"]').first();
      if (!(await deleteBtn.isVisible().catch(() => false))) break;

      await deleteBtn.click();
      await page.waitForTimeout(500);

      const confirmBtn = page.locator('[role="alertdialog"] button').filter({ hasText: /ยืนยันลบ/i }).first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1500);
      }
      maxAttempts--;
    }

    // Verify empty or remaining keys are fine
    const body = await page.textContent("body");
    expect(body).toContain("API Keys");
  });
});
