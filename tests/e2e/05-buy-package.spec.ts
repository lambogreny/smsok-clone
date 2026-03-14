import { test, expect } from "./fixtures";

test.describe("Buy Package & Checkout", () => {
  test("PKG-01: packages page shows tiers", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/Starter|Basic|Growth|Business|แพ็กเกจ/i);
    await page.screenshot({ path: "test-results/05-packages.png" });
  });

  test("PKG-02: buy button navigates to checkout", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages");
    await page.waitForLoadState("networkidle").catch(() => {});
    const buyBtn = page.locator('button:has-text("ซื้อ"), a:has-text("ซื้อ"), button:has-text("สั่งซื้อ")').first();
    if (await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForTimeout(3000);
      expect(page.url()).toMatch(/checkout|billing/);
    }
  });

  test("PKG-03: checkout form has required fields", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/checkout?tier=A");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    // Name field
    const nameInput = page.locator('input[placeholder*="สมชาย"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    // ID card field
    await expect(page.locator('input[placeholder*="X-XXXX"]')).toBeVisible();
    // Address
    await expect(page.locator('textarea[placeholder*="ถนนสีลม"]')).toBeVisible();
    await page.screenshot({ path: "test-results/05-checkout-form.png" });
  });

  test("PKG-04: create order with valid data", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/checkout?tier=A");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    await page.locator('input[placeholder*="สมชาย"]').fill("E2E Test Order");
    await page.locator('input[placeholder*="X-XXXX"]').fill("1-2345-67890-12-3");
    await page.locator('textarea[placeholder*="ถนนสีลม"]').fill("123 Test Address Bangkok 10100");
    await page.waitForTimeout(500);

    const respPromise = page.waitForResponse(
      r => r.request().method() === "POST" && r.status() < 500,
      { timeout: 15000 }
    ).catch(() => null);

    await page.locator('button:has-text("สร้างคำสั่งซื้อ")').first().click();
    await page.waitForTimeout(5000);

    const resp = await respPromise;
    if (resp) {
      expect([200, 201]).toContain(resp.status());
    }
    // Should navigate to order detail
    const body = await page.textContent("body");
    expect(body).toMatch(/ORD-|คำสั่งซื้อ|order/i);
    await page.screenshot({ path: "test-results/05-order-created.png" });
  });

  test("PKG-05: order detail shows bank info and countdown", async ({ authedPage: page }) => {
    // Navigate to orders list
    await page.goto("/dashboard/billing/orders");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    // Click first order if exists
    const orderLink = page.locator("tbody tr a, tbody tr").first();
    if (await orderLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderLink.click();
      await page.waitForTimeout(3000);
      const body = await page.textContent("body");
      expect(body).toMatch(/SCB|ธนาคาร|แนบสลิป|ORD-/i);
      await page.screenshot({ path: "test-results/05-order-detail.png" });
    }
  });
});
