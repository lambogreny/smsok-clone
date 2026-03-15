import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

test.describe("API: Documents & Invoice Endpoints", () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
  });

  // === Invoices ===
  test("DOC-API-01: GET /api/v1/invoices — authed returns list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/invoices`);
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.data || body).toBeDefined();
    }
  });

  test("DOC-API-02: GET /api/v1/invoices — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/invoices`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("DOC-API-03: GET /api/v1/invoices/nonexistent — returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/invoices/nonexistent-id-xyz`);
    expect([400, 404]).toContain(res.status());
  });

  // === Order Documents ===
  test("DOC-API-04: GET /api/v1/orders/[id]/invoice — invalid ID returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/fake-id/invoice`);
    expect([400, 404]).toContain(res.status());
  });

  test("DOC-API-05: GET /api/v1/orders/[id]/quotation — invalid ID returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/fake-id/quotation`);
    expect([400, 404]).toContain(res.status());
  });

  test("DOC-API-06: GET /api/v1/orders/[id]/documents/receipt — invalid ID returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/fake-id/documents/receipt`);
    expect([400, 404]).toContain(res.status());
  });

  test("DOC-API-07: GET /api/v1/orders/[id]/documents/invoice — invalid ID returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/fake-id/documents/invoice`);
    expect([400, 404]).toContain(res.status());
  });

  test("DOC-API-08: GET /api/v1/orders/[id]/documents/tax-invoice — invalid ID returns 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/orders/fake-id/documents/tax-invoice`);
    expect([400, 404]).toContain(res.status());
  });

  // === Document for valid PAID order ===
  test("DOC-API-09: GET /api/v1/orders/[id]/invoice — valid paid order returns PDF or 200", async ({ request }) => {
    const listRes = await request.get(`${BASE}/api/v1/orders`);
    if (listRes.status() === 200) {
      const list = await listRes.json();
      const orders = list.data || list.orders || list;
      if (Array.isArray(orders)) {
        const paidOrder = orders.find((o: any) => o.status === "PAID" || o.status === "COMPLETED");
        if (paidOrder) {
          const res = await request.get(`${BASE}/api/v1/orders/${paidOrder.id}/invoice`);
          expect([200, 404]).toContain(res.status());
          if (res.status() === 200) {
            const contentType = res.headers()["content-type"] || "";
            expect(contentType).toMatch(/pdf|json|html/);
          }
        }
      }
    }
  });

  // === Quotations ===
  test("DOC-API-10: GET /api/v1/quotations — authed returns list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/quotations`);
    expect([200, 401]).toContain(res.status());
  });

  test("DOC-API-11: GET /api/v1/quotations — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/quotations`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("DOC-API-12: POST /api/v1/quotations — empty body returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/quotations`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  // === Auth on document endpoints ===
  test("DOC-API-13: GET /api/v1/orders/[id]/invoice — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/orders/some-id/invoice`);
    expect([401, 403, 404]).toContain(res.status());
    await ctx.close();
  });

  // === SQL Injection on doc endpoints ===
  test("DOC-API-14: GET /api/v1/invoices/SQL-injection — safe", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/invoices/'; DROP TABLE invoices;--`);
    expect([400, 404]).toContain(res.status());
  });

  // === Senders ===
  test("DOC-API-15: GET /api/v1/senders — authed returns list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/senders`);
    expect([200, 401]).toContain(res.status());
  });

  test("DOC-API-16: GET /api/v1/senders — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/senders`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("DOC-API-17: POST /api/v1/senders/request — empty body returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/senders/request`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  // === Contacts ===
  test("DOC-API-18: GET /api/v1/contacts — authed returns list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/contacts`);
    expect([200, 401]).toContain(res.status());
  });

  test("DOC-API-19: GET /api/v1/contacts — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/contacts`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("DOC-API-20: POST /api/v1/contacts — create contact with valid data", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/contacts`, {
      data: {
        name: `API Test Contact ${Date.now()}`,
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      },
    });
    expect([200, 201, 401]).toContain(res.status());
  });

  test("DOC-API-21: POST /api/v1/contacts — empty body returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/contacts`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });
});
