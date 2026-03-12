import { test, expect } from "./fixtures";

test.describe("Responsive Design", () => {
  // TC-120: Mobile 375px — no overflow
  test("TC-120: no horizontal overflow on mobile (375px)", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const isOverflowing = await page.evaluate(
      () => document.body.scrollWidth > window.innerWidth
    );
    expect(isOverflowing).toBe(false);
  });

  // TC-120b: Sidebar hidden on mobile
  test("TC-120b: sidebar collapses on mobile", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const sidebar = page.locator("aside, [class*='sidebar']").first();
    if (await sidebar.count()) {
      const isVisible = await sidebar.evaluate(
        (el) => getComputedStyle(el).display !== "none"
      );
      expect(isVisible).toBe(false);
    }
  });

  // TC-121: Send SMS form usable on mobile
  test("TC-121: send SMS form visible on mobile", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/send", { waitUntil: "networkidle" });
    // Send button might have different text — look for submit or send button
    const sendBtn = page.locator('button[type="submit"], button:has-text("ส่ง"), button:has-text("Send")').first();
    await expect(sendBtn).toBeVisible();
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible();
  });

  // TC-122: Tablet 768px
  test("TC-122: layout adapts on tablet (768px)", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
    // No horizontal overflow
    const isOverflowing = await page.evaluate(
      () => document.body.scrollWidth > window.innerWidth
    );
    expect(isOverflowing).toBe(false);
  });

  // TC-123: Desktop 1440px — full layout
  test("TC-123: full layout with sidebar on desktop (1440px)", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const nav = page.locator("nav, aside, [class*='sidebar']").first();
    await expect(nav).toBeVisible();
  });
});
