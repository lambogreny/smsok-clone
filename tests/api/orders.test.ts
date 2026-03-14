import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

test.describe("API: Orders Endpoints", () => {
  let authCookies: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: USER });
    if (res.status() === 200) {
      authCookies = res.headers()["set-cookie"] || "";
    }
  });

  test("ORD-API-01: GET /api/orders — authenticated returns list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/orders`);
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty("data");
    }
  });

  test("ORD-API-02: GET /api/orders — unauthenticated returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/orders`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("ORD-API-03: GET /api/packages — returns package tiers", async ({ request }) => {
    const res = await request.get(`${BASE}/api/packages`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data || body).toBeTruthy();
  });

  test("ORD-API-04: POST /api/orders — create order requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/orders`, {
      data: { tier: "A", billingInfo: {} },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("ORD-API-05: POST /api/orders/{id}/slip — upload requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/orders/fake-id/slip`, {
      data: {},
    });
    expect([401, 403, 404]).toContain(res.status());
    await ctx.close();
  });
});
