import { test, expect, collectConsoleErrors } from "./fixtures";

test.describe("Error States & Edge Cases", () => {
  // === 404 Pages ===
  test("ERR-01: 404 page for non-existent dashboard route", async ({ authedPage: page }) => {
    await page.goto("/dashboard/nonexistent-page-xyz");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/404|not found|ไม่พบ/i);
    await page.screenshot({ path: "test-results/12-error-404.png" });
  });

  test("ERR-02: 404 for non-existent public route", async ({ authedPage: page }) => {
    await page.goto("/this-page-does-not-exist-xyz");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/404|not found|ไม่พบ/i);
  });

  // === Empty States ===
  test("ERR-03: contacts shows list or empty state (no crash)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toMatch(/500|Internal Server Error|Something went wrong/i);
    await page.screenshot({ path: "test-results/12-contacts-empty.png" });
  });

  test("ERR-04: SMS history shows list or empty state (no crash)", async ({ authedPage: page }) => {
    await page.goto("/dashboard/history");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toMatch(/500|Internal Server Error|Something went wrong/i);
  });

  test("ERR-05: campaigns shows list or empty state", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toMatch(/500|Internal Server Error|Something went wrong/i);
  });

  // === Invalid IDs ===
  test("ERR-06: invalid order ID shows error gracefully", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/orders/invalid-order-id-xyz");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่พบ|not found|error|404/i);
  });

  test("ERR-07: invalid contact ID shows error gracefully", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts/invalid-contact-id-xyz");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่พบ|not found|error|404/i);
  });

  test("ERR-08: invalid campaign ID shows error gracefully", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns/invalid-campaign-id-xyz");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่พบ|not found|error|404/i);
  });

  // === Success Page Edge Cases ===
  test("ERR-09: billing/success without order param shows error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/success");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่พบ|error|ไม่สามารถ/i);
    expect(body).not.toMatch(/สำเร็จ|ถูกเพิ่ม/i);
  });

  test("ERR-10: billing/success with invalid order shows error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/billing/success?order=INVALID_ID");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/ไม่สามารถ|error|ไม่พบ/i);
    expect(body).not.toMatch(/สำเร็จ.*ถูกเพิ่ม/i);
  });

  // === Auth Edge Cases ===
  test("ERR-11: protected API without auth returns 401", async ({ authedPage: page }) => {
    const ctx = page.context();
    await ctx.clearCookies();
    const res = await page.request.get("/api/v1/orders");
    expect([401, 403]).toContain(res.status());
  });

  test("ERR-12: session expired — redirect to login on page reload", async ({ authedPage: page }) => {
    // Clear cookies to simulate expired session
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await page.waitForURL(/\/login|\/session-expired/, { timeout: 10000 }).catch(() => {});
    expect(page.url()).toMatch(/\/login|\/session-expired/);
    await page.screenshot({ path: "test-results/12-session-expired.png" });
  });

  // === Forbidden Page ===
  test("ERR-13: forbidden page loads correctly", async ({ authedPage: page }) => {
    await page.goto("/forbidden");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/403|forbidden|ไม่มีสิทธิ์|access denied/i);
  });

  // === Maintenance Page ===
  test("ERR-14: maintenance page loads correctly", async ({ authedPage: page }) => {
    await page.goto("/maintenance");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/maintenance|ปิดปรับปรุง|ระบบ/i);
  });

  // === Offline Page ===
  test("ERR-15: offline page loads correctly", async ({ authedPage: page }) => {
    await page.goto("/offline");
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");
    expect(body).toMatch(/offline|ออฟไลน์|internet|เชื่อมต่อ/i);
  });

  // === API Error Handling ===
  test("ERR-16: GET /api/v1/orders/SQL-injection — safe", async ({ authedPage: page }) => {
    const res = await page.request.get("/api/v1/orders/'; DROP TABLE orders;--");
    expect([400, 404]).toContain(res.status());
  });

  test("ERR-17: GET /api/v1/contacts/XSS — safe", async ({ authedPage: page }) => {
    const res = await page.request.get('/api/v1/contacts/<script>alert(1)</script>');
    expect([400, 404]).toContain(res.status());
    const body = await res.text();
    expect(body).not.toContain("<script>");
  });

  // === Double Action Protection ===
  test("ERR-18: rapid navigation doesn't crash app", async ({ authedPage: page }) => {
    // Rapidly navigate between pages
    const routes = ["/dashboard", "/dashboard/send", "/dashboard/contacts", "/dashboard/billing"];
    for (const route of routes) {
      page.goto(route).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");
  });
});
