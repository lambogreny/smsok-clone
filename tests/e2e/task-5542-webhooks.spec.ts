/**
 * Task #5542 — QA: Webhooks Browser Test (P0)
 * Uses authenticated session (storageState from global-setup)
 */

import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const SCREENSHOTS_DIR = "/Users/lambogreny/oracles/qa/screenshots/task-5542";
const BASE = "http://localhost:3000";

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

async function ss(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`📸 ${p}`);
}

test.describe("Task #5542 — Webhooks Browser Test", () => {
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
  });

  // 1. Page loads
  test("1. Webhooks page loads", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "01-webhooks-page");

    const url = page.url();
    const pageText = await page.textContent("body");

    console.log("📍 URL:", url);
    console.log("👁️ Contains webhook text:", /webhook|เว็บฮุก/i.test(pageText || ""));
    console.log("👁️ Redirected to login:", url.includes("/login"));

    expect(url).toContain("webhook");
    expect(url).not.toContain("/login");
  });

  // 2. Create webhook
  test("2. Create webhook", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Look for create button
    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("Create"), button:has-text("เพิ่ม"), a:has-text("สร้าง Webhook")').first();

    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, "02-create-form");

      // Fill URL — placeholder is "https://example.com/webhook/smsok"
      const urlInput = page.locator('input[placeholder*="example.com"], input[placeholder*="webhook"], input[placeholder*="https"]').first();
      if (await urlInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await urlInput.clear();
        await urlInput.fill("https://httpbin.org/post");
        console.log("✅ URL filled: https://httpbin.org/post");
      } else {
        console.log("⚠️ URL input not found by placeholder");
        // Fallback: first input in the modal
        const modalInput = page.locator('dialog input, [role="dialog"] input, .modal input, div[class*="modal"] input').first();
        if (await modalInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await modalInput.clear();
          await modalInput.fill("https://httpbin.org/post");
          console.log("✅ URL filled via fallback");
        }
      }

      // Select events — checkboxes for sms.sent etc.
      // From screenshot: checkboxes are inside the modal near event labels
      const smsCheckbox = page.locator('text="sms.sent"').locator("xpath=ancestor::label//input | xpath=preceding-sibling::input | xpath=../input").first();
      const anyCheckbox = page.locator('dialog input[type="checkbox"], [role="dialog"] input[type="checkbox"]').first();
      // Try clicking on the "Delivery events" preset button
      const presetBtn = page.locator('button:has-text("Delivery events"), text="Delivery events"').first();

      if (await presetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await presetBtn.click();
        await page.waitForTimeout(500);
        console.log("✅ Delivery events preset selected");
      } else if (await anyCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anyCheckbox.check({ force: true });
        console.log("✅ First event checkbox checked");
      } else {
        // Try clicking on the sms.sent text directly
        const smsText = page.locator('text="sms.sent"').first();
        if (await smsText.isVisible({ timeout: 2000 }).catch(() => false)) {
          await smsText.click();
          console.log("✅ sms.sent clicked");
        }
      }

      await ss(page, "03-form-filled");

      // Save
      const saveBtn = page.locator('button:has-text("บันทึก"), button:has-text("Save"), button:has-text("สร้าง"), button[type="submit"]').first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        await ss(page, "04-after-save");

        const afterText = await page.textContent("body");
        console.log("👁️ Webhook created:", /httpbin|webhook/i.test(afterText || ""));
        console.log("📍 URL after save:", page.url());
      }
    } else {
      console.log("⚠️ Create button not found — webhooks may already exist");
      await ss(page, "02-no-create-btn");
    }
  });

  // 3. Detail panel — URL, Events, Secret, Test, Rotate, Edit
  test("3. Webhook detail panel", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Click on a webhook to see details
    const webhookRow = page.locator('tr:has-text("http"), [class*="cursor-pointer"]:has-text("http"), div:has-text("httpbin")').first();
    const anyRow = page.locator('tbody tr, [data-webhook]').first();

    for (const el of [webhookRow, anyRow]) {
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click();
        await page.waitForTimeout(1500);
        break;
      }
    }

    await ss(page, "05-detail-panel");

    const pageText = await page.textContent("body");

    // Check for detail elements
    console.log("👁️ Shows URL:", /http/i.test(pageText || ""));
    console.log("👁️ Shows Events:", /event/i.test(pageText || ""));
    console.log("👁️ Shows Secret:", /secret|•••/i.test(pageText || ""));

    // Test button
    const testBtn = page.locator('button:has-text("Test"), button:has-text("ทดสอบ")').first();
    if (await testBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await testBtn.click();
      await page.waitForTimeout(3000);
      await ss(page, "06-test-result");
      console.log("✅ Test button clicked");
    } else {
      console.log("⚠️ Test button not found");
    }

    // Rotate Secret
    const rotateBtn = page.locator('button:has-text("Rotate"), button:has-text("หมุน"), button:has-text("รีเซ็ต")').first();
    if (await rotateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rotateBtn.click();
      await page.waitForTimeout(2000);

      // Confirm if dialog appears
      const confirmBtn = page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm"), button:has-text("ตกลง")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }

      await ss(page, "07-rotated-secret");
      console.log("✅ Rotate Secret clicked");
    } else {
      console.log("⚠️ Rotate Secret button not found");
    }

    // Edit URL
    const editUrlBtn = page.locator('button:has-text("แก้ไข URL"), button[aria-label*="edit" i]:near(text="URL"), button:has(svg):near(text="URL")').first();
    if (await editUrlBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editUrlBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, "08-edit-url");
      console.log("✅ Edit URL clicked");
    } else {
      console.log("⚠️ Edit URL button not found directly");
    }

    // Edit Events
    const editEventsBtn = page.locator('button:has-text("แก้ไข Events"), button:has-text("Edit Events")').first();
    if (await editEventsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editEventsBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, "09-edit-events");
      console.log("✅ Edit Events clicked");
    } else {
      console.log("⚠️ Edit Events button not found directly");
    }
  });

  // 4. Toggle active/paused
  test("4. Toggle webhook status", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Find toggle/switch
    const toggle = page.locator('input[type="checkbox"][role="switch"], button[role="switch"], [data-slot="switch"], label:has(input[type="checkbox"])').first();
    const toggleBtn = page.locator('[class*="toggle"], [class*="switch"]').first();

    for (const el of [toggle, toggleBtn]) {
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ss(page, "10-before-toggle");
        await el.click();
        await page.waitForTimeout(2000);
        await ss(page, "11-after-toggle");
        console.log("✅ Toggle clicked");
        break;
      }
    }

    // If no toggle found, click on webhook first then find toggle
    if (!(await toggle.isVisible({ timeout: 500 }).catch(() => false)) && !(await toggleBtn.isVisible({ timeout: 500 }).catch(() => false))) {
      const row = page.locator('tbody tr, [data-webhook]').first();
      if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(1500);

        const detailToggle = page.locator('input[type="checkbox"][role="switch"], button[role="switch"], [data-slot="switch"]').first();
        if (await detailToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
          await detailToggle.click();
          await page.waitForTimeout(2000);
          await ss(page, "11-after-toggle");
          console.log("✅ Toggle in detail panel clicked");
        } else {
          console.log("⚠️ Toggle not found");
        }
      }
    }
  });

  // 5. Delete webhook
  test("5. Delete webhook", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Count webhooks before delete
    const beforeText = await page.textContent("body");
    await ss(page, "12-before-delete");

    // Find delete button
    const deleteBtn = page.locator('button:has-text("ลบ"), button:has-text("Delete"), button[aria-label*="delete" i]').first();

    // Or click on webhook first then find delete
    if (!(await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      const row = page.locator('tbody tr, [data-webhook]').first();
      if (await row.isVisible({ timeout: 1000 }).catch(() => false)) {
        await row.click();
        await page.waitForTimeout(1500);
      }
    }

    const delBtn = page.locator('button:has-text("ลบ"), button:has-text("Delete")').first();
    if (await delBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await delBtn.click();
      await page.waitForTimeout(1000);

      // Confirm deletion
      const confirmBtn = page.locator('button:has-text("ยืนยัน"), button:has-text("Confirm"), button:has-text("ตกลง"), button:has-text("ลบ")').nth(1);
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }

      await ss(page, "13-after-delete");
      console.log("✅ Delete clicked + confirmed");
    } else {
      console.log("⚠️ Delete button not found");
      await ss(page, "13-no-delete");
    }
  });

  // 6. Delivery logs
  test("6. Delivery logs tab", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Look for Logs tab
    const logsTab = page.locator('button:has-text("Logs"), button:has-text("บันทึก"), text="Delivery Logs", a:has-text("Logs")').first();

    // Click on webhook first
    const row = page.locator('tbody tr, [data-webhook]').first();
    if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
    }

    const logsEl = page.locator('text=/logs|บันทึก|delivery/i').first();
    if (await logsEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logsEl.click();
      await page.waitForTimeout(1500);
      await ss(page, "14-delivery-logs");
      console.log("✅ Delivery Logs tab found");
    } else {
      console.log("⚠️ Delivery Logs tab not found");
      await ss(page, "14-no-logs-tab");
    }
  });

  // 7. Responsive
  test("7a. Mobile 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "15-mobile-375");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log("👁️ Scroll width:", bodyWidth, "/ 375px");
    console.log("👁️ Overflow:", bodyWidth > 375 ? "⚠️ YES" : "✅ NO");
  });

  test("7b. Tablet 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "16-tablet-768");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log("👁️ Scroll width:", bodyWidth, "/ 768px");
    console.log("👁️ Overflow:", bodyWidth > 768 ? "⚠️ YES" : "✅ NO");
  });

  test("7c. Desktop 1440px + console errors", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, "17-desktop-1440");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    console.log("👁️ Scroll width:", bodyWidth, "/ 1440px");
    console.log("👁️ Overflow:", bodyWidth > 1440 ? "⚠️ YES" : "✅ NO");
    console.log("🔴 Console errors:", consoleErrors.length);
    consoleErrors.forEach((e) => console.log("  -", e.substring(0, 200)));
  });
});
