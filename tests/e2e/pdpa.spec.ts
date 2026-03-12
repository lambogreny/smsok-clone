import { test, expect, expectPageLoads } from "./fixtures";

test.describe("PDPA & Privacy", () => {
  // TC-140: PDPA page loads (moved to /dashboard/settings/pdpa)
  test("TC-140: PDPA page loads with privacy content", async ({ authedPage: page }) => {
    await expectPageLoads(page, "/dashboard/settings/pdpa");
    const body = await page.textContent("body");
    const hasPDPA =
      body!.includes("PDPA") ||
      body!.includes("ข้อมูลส่วนบุคคล") ||
      body!.includes("Privacy") ||
      body!.includes("ความเป็นส่วนตัว") ||
      body!.includes("ความยินยอม");
    expect(hasPDPA).toBeTruthy();
  });

  // TC-141: Toggle privacy
  test("TC-141: privacy toggles change state on click", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/pdpa", { waitUntil: "networkidle" });
    const switches = page.locator('[role="switch"]');
    const count = await switches.count();

    if (count > 0) {
      const sw = switches.first();
      const before = await sw.getAttribute("data-state") ?? await sw.getAttribute("aria-checked");
      await sw.click();
      // Wait for state change
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      const after = await sw.getAttribute("data-state") ?? await sw.getAttribute("aria-checked");
      expect(after).not.toBe(before);
    }
  });
});
