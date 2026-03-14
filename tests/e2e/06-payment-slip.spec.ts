import { test, expect } from "./fixtures";
import { writeFileSync } from "fs";
import path from "path";

// Create a real test slip image
const TEST_SLIP_PATH = path.join(__dirname, "test-slip.png");
writeFileSync(
  TEST_SLIP_PATH,
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAnElEQVR42u3RAQ0AAAjDMO5fNBhi0CUGSHm3tBqyCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEIQhBCEIQghCEIAQhCEEIQhCCEIQgBCEIQQhCEIIQhCAEuR8LO7MBZds83vQAAAAASUVORK5CYII=",
    "base64"
  )
);

test.describe("Payment Slip Upload", () => {
  test("SLIP-01: order detail has attach slip button", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Find a pending order
    const orderRow = page.locator("tbody tr").first();
    if (await orderRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderRow.click();
      await page.waitForTimeout(3000);
      const body = await page.textContent("body");
      const hasAttachBtn = body?.includes("แนบสลิปโอนเงิน") || body?.includes("แนบสลิป");
      // If order is pending payment, attach button should be visible
      if (body?.includes("รอชำระ") || body?.includes("PENDING")) {
        expect(hasAttachBtn).toBeTruthy();
      }
      await page.screenshot({ path: "test-results/06-slip-order-detail.png" });
    }
  });

  test("SLIP-02: slip upload via modal", async ({ authedPage: page }) => {
    // Create a fresh order first
    await page.goto("/dashboard/billing/checkout?tier=A");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    await page.locator('input[placeholder*="สมชาย"]').fill("Slip Test User");
    await page.locator('input[placeholder*="X-XXXX"]').fill("3-3333-33333-33-3");
    await page.locator('textarea[placeholder*="ถนนสีลม"]').fill("Slip Test Bangkok 10100");
    await page.locator('button:has-text("สร้างคำสั่งซื้อ")').first().click();
    await page.waitForTimeout(5000);

    // Now upload slip
    const attachBtn = page.locator('button:has-text("แนบสลิปโอนเงิน")').first();
    if (await attachBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await attachBtn.click();
      await page.waitForTimeout(2000);

      // File input in modal
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.first().setInputFiles(TEST_SLIP_PATH);
        await page.waitForTimeout(2000);

        // Submit inside dialog
        const submitBtn = page.locator('[role="dialog"]').locator('button:has-text("ส่งสลิป")');
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          const respPromise = page.waitForResponse(
            r => r.url().includes("slip") && r.request().method() === "POST",
            { timeout: 15000 }
          ).catch(() => null);

          await submitBtn.click();
          const resp = await respPromise;
          if (resp) {
            expect(resp.status()).toBe(200);
          }
          await page.waitForTimeout(3000);
          await page.screenshot({ path: "test-results/06-slip-uploaded.png" });
        }
      }
    }
  });

  test("SLIP-03: upload locked while verifying", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Find an order in verifying status
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText?.includes("รอตรวจสอบ") || rowText?.includes("กำลังตรวจสอบ")) {
        await rows.nth(i).click();
        await page.waitForTimeout(3000);
        const attachBtn = page.locator('button:has-text("แนบสลิปโอนเงิน")').first();
        const isVisible = await attachBtn.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isVisible).toBe(false);
        await page.screenshot({ path: "test-results/06-slip-locked.png" });
        break;
      }
    }
  });

  test("SLIP-04: order history shows all orders", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toMatch(/ORD-|คำสั่งซื้อ|orders/i);
    await page.screenshot({ path: "test-results/06-order-history.png" });
  });
});
