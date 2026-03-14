import { test, expect } from "./fixtures";

test.describe("Error States & Edge Cases", () => {
  test("ERR-01: 404 page for non-existent route", async ({ authedPage: page }) => {
    await page.goto("/dashboard/nonexistent-page-xyz");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/404|not found|ไม่พบ/i);
    await page.screenshot({ path: "test-results/12-error-404.png" });
  });

  test("ERR-02: empty state on contacts (if no contacts)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    // Should show either contacts list or empty state — not error
    expect(body).not.toMatch(/500|Internal Server Error/i);
    await page.screenshot({ path: "test-results/12-contacts-empty.png" });
  });

  test("ERR-03: empty state on SMS history (if no messages)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toMatch(/500|Internal Server Error/i);
  });

  test("ERR-04: invalid order ID shows error gracefully", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders/invalid-order-id-xyz");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่พบ|not found|error|404/i);
  });

  test("ERR-05: billing/success without order param shows error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/success");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่พบ|error|ไม่สามารถ/i);
    expect(body).not.toMatch(/สำเร็จ|ถูกเพิ่ม/i);
  });

  test("ERR-06: billing/success with invalid order shows error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/success?order=INVALID_ID");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่สามารถ|error|ไม่พบ/i);
    expect(body).not.toMatch(/สำเร็จ.*ถูกเพิ่ม/i);
  });

  test("ERR-07: protected API without auth returns 401", async ({ authedPage: page }) => {
    // Clear cookies and try API
    const ctx = page.context();
    await ctx.clearCookies();
    const res = await page.request.get("/api/orders");
    expect([401, 403]).toContain(res.status());
  });
});
