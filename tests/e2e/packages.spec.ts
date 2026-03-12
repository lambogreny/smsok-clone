import { test, expect, expectPageLoads } from "./fixtures";

test.describe("Packages & Purchase Flow", () => {
  // TC-050: Packages page loads
  test("TC-050: packages page loads with price cards", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/packages");
    const body = await page.textContent("body");
    expect(body).toMatch(/฿[\d,]+/); // Has Thai baht prices
    expect(body).toMatch(/[\d,]+\s*SMS/i); // Has SMS amounts
  });

  // TC-051: Package cards display
  test("TC-051: at least 2 package cards shown", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // TC-052: Click package navigates to checkout
  test("TC-052: clicking package card starts purchase flow", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });

    // Find a package button with price
    const pkgBtn = page.locator("button").filter({ hasText: /฿/ }).first();
    if (await pkgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pkgBtn.click();
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      // Should navigate to checkout or open dialog
      const url = page.url();
      const hasDialog = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      expect(
        url.includes("checkout") || url.includes("billing") || hasDialog
      ).toBeTruthy();
    }
  });

  // TC-053: Checkout shows price info
  test("TC-053: checkout page displays package pricing", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });
    const pkgBtn = page.locator("button").filter({ hasText: /฿/ }).first();
    if (!(await pkgBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, "No package button found");
      return;
    }
    await pkgBtn.click();
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    if (page.url().includes("checkout") || page.url().includes("billing")) {
      const body = await page.textContent("body");
      expect(body).toMatch(/฿[\d,]+/); // Has price
      expect(body).toContain("SMS"); // Has SMS reference
    }
  });

  // TC-058: Packages publicly accessible
  test("TC-058: packages page accessible without auth", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/dashboard/packages", { waitUntil: "networkidle" });
    expect(page.url()).toContain("/packages");
    const body = await page.textContent("body");
    expect(body).toMatch(/฿[\d,]+/);
    expect(body).toMatch(/[\d,]+\s*SMS/i);
    await context.close();
  });
});
