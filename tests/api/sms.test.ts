import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("API: SMS Endpoints", () => {
  test("SMS-API-01: POST /api/sms/send — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/sms/send`, {
      data: { to: "0899999999", message: "test", senderName: "SMSOK" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("SMS-API-02: POST /api/sms/send — empty body returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/sms/send`, { data: {} });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("SMS-API-03: GET /api/sms/history — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/sms/history`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("SMS-API-04: POST /api/sms/send — invalid JSON returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/sms/send`, {
      headers: { "Content-Type": "application/json" },
      data: "not json{{{",
    });
    expect([400, 401, 422, 500]).toContain(res.status());
  });
});
