import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("API Docs Page — Task #5157", () => {
  test("DOCS-01: api-docs page loads without error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-docs", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/Internal Server Error|Something went wrong|Runtime Error/i);

    // Should have API documentation content
    const hasApiContent = body.includes("API") || body.includes("endpoint") || body.includes("เอกสาร");
    expect(hasApiContent).toBeTruthy();

    await page.screenshot({ path: "test-results/api-docs-01-loaded.png" });
  });

  test("DOCS-02: api-docs shows documentation content", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-docs", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const body = await page.evaluate(() => document.body.innerText);

    // Should have actual API docs content (endpoints, methods, examples)
    const hasEndpoints = body.includes("/api/") || body.includes("GET") || body.includes("POST") ||
      body.includes("SMS") || body.includes("send") || body.includes("Authentication");
    expect(hasEndpoints).toBeTruthy();

    await page.screenshot({ path: "test-results/api-docs-02-content.png" });
  });

  test("DOCS-03: no console errors on api-docs", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/api-docs", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(3000);

    const realErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("sw.js") &&
      !e.includes("Failed to load resource") && !e.includes("hydrat") &&
      !e.includes("server rendered HTML")
    );

    await page.screenshot({ path: "test-results/api-docs-03-console.png" });
    expect(realErrors).toHaveLength(0);
  });

  test("DOCS-04: api-docs responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/api-docs", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
    await page.screenshot({ path: "test-results/api-docs-04-responsive.png" });
  });
});
