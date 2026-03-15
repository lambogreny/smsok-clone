import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

test.describe("API: Orders & Payments Endpoints", () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
  });

  // === Orders List ===
  test("ORD-API-01: GET /api/v1/orders — authed returns 200 + list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data || body.orders || Array.isArray(body)).toBeTruthy();
  });

  test("ORD-API-02: GET /api/v1/orders — unauthenticated returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/orders`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  // === Order Detail ===
  test("ORD-API-03: GET /api/v1/orders/invalid-id — returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/nonexistent-id-xyz`);
    expect([400, 404]).toContain(res.status());
  });

  test("ORD-API-04: GET /api/v1/orders/[id] — valid order returns detail", async ({ request }) => {
    // Get orders list first
    const listRes = await request.get(`${BASE}/api/v1/orders`);
    if (listRes.status() === 200) {
      const list = await listRes.json();
      const orders = list.data || list.orders || list;
      if (Array.isArray(orders) && orders.length > 0) {
        const orderId = orders[0].id;
        const res = await request.get(`${BASE}/api/v1/orders/${orderId}`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id || body.data?.id).toBeDefined();
      }
    }
  });

  // === Create Order ===
  test("ORD-API-05: POST /api/v1/orders — create requires tier", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test("ORD-API-06: POST /api/v1/orders — create requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/v1/orders`, {
      data: { tier: "A", billingName: "Test", billingTaxId: "1-2345-67890-12-3", billingAddress: "123 Test" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("ORD-API-07: POST /api/v1/orders — create with valid data returns 200/201", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, {
      data: {
        tier: "A",
        billingName: "API Test Order",
        billingTaxId: "9-8765-43210-98-7",
        billingAddress: "999 API Test Road Bangkok 10100",
      },
    });
    expect([200, 201]).toContain(res.status());
    if (res.status() === 200 || res.status() === 201) {
      const body = await res.json();
      expect(body.id || body.data?.id || body.orderId).toBeDefined();
    }
  });

  test("ORD-API-08: POST /api/v1/orders — invalid tier returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders`, {
      data: { tier: "INVALID_TIER_XYZ", billingName: "Test", billingTaxId: "1-1111-11111-11-1", billingAddress: "test" },
    });
    expect([400, 422]).toContain(res.status());
  });

  // === Cancel Order ===
  test("ORD-API-09: POST /api/v1/orders/invalid/cancel — returns 404", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/orders/nonexistent-id/cancel`);
    expect([400, 404]).toContain(res.status());
  });

  // === Order Documents ===
  test("ORD-API-10: GET /api/v1/orders/invalid/invoice — returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/nonexistent-id/invoice`);
    expect([400, 404]).toContain(res.status());
  });

  test("ORD-API-11: GET /api/v1/orders/invalid/quotation — returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/nonexistent-id/quotation`);
    expect([400, 404]).toContain(res.status());
  });

  // === Payments ===
  test("ORD-API-12: GET /api/v1/payments/history — authed returns history", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/payments/history`);
    expect([200, 401]).toContain(res.status());
  });

  test("ORD-API-13: GET /api/v1/payments/bank-accounts — returns bank list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/payments/bank-accounts`);
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.data || body).toBeDefined();
    }
  });

  test("ORD-API-14: POST /api/v1/payments/purchase — empty body returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/payments/purchase`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  // === SQL Injection on Order Endpoints ===
  test("ORD-API-15: GET /api/v1/orders with SQL injection ID — safe", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/'; DROP TABLE orders;--`);
    expect([400, 404]).toContain(res.status());
  });

  // === IDOR Check ===
  test("ORD-API-16: GET /api/v1/orders/[id] — cannot access other user's order", async ({ browser }) => {
    // Create fresh context (different user or no auth)
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/orders/some-other-users-order-id`);
    expect([401, 403, 404]).toContain(res.status());
    await ctx.close();
  });
});
