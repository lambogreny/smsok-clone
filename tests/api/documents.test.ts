import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("API: Documents Endpoints", () => {
  test("DOC-API-01: GET /api/documents — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/documents`);
    expect([401, 403, 404]).toContain(res.status());
    await ctx.close();
  });

  test("DOC-API-02: GET /api/orders/{id}/documents — invalid ID", async ({ request }) => {
    const res = await request.get(`${BASE}/api/orders/fake-id/documents`);
    expect([401, 403, 404]).toContain(res.status());
  });

  test("DOC-API-03: GET /api/orders/{id}/invoice — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/orders/fake-id/invoice`);
    expect([401, 403, 404]).toContain(res.status());
    await ctx.close();
  });
});
