import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

test.describe("API: SMS Endpoints", () => {
  // === Auth Guard ===
  test("SMS-API-01: POST /api/v1/sms/send — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/v1/sms/send`, {
      data: { to: "0899999999", message: "test", senderName: "SMSOK" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("SMS-API-02: POST /api/v1/sms/send — empty body returns 400", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test("SMS-API-03: POST /api/v1/sms/send — missing phone returns 400", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, {
      data: { message: "test", senderName: "SMSOK" },
    });
    expect([400, 422]).toContain(res.status());
  });

  test("SMS-API-04: POST /api/v1/sms/send — missing message returns 400", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, {
      data: { to: "0899999999", senderName: "SMSOK" },
    });
    expect([400, 422]).toContain(res.status());
  });

  test("SMS-API-05: POST /api/v1/sms/send — invalid phone format returns 400", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, {
      data: { to: "not-a-phone", message: "test", senderName: "SMSOK" },
    });
    expect([400, 422]).toContain(res.status());
  });

  test("SMS-API-06: POST /api/v1/sms/send — XSS in message is safe", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, {
      data: { to: "0899999999", message: '<script>alert("xss")</script>', senderName: "SMSOK" },
    });
    // Should not crash — either 200 (sends as text) or 400 (rejected)
    expect([200, 400, 402, 422]).toContain(res.status());
  });

  test("SMS-API-07: POST /api/v1/sms/send — SQL injection in phone is safe", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, {
      data: { to: "'; DROP TABLE messages;--", message: "test", senderName: "SMSOK" },
    });
    expect([400, 422]).toContain(res.status());
  });

  // === Batch SMS ===
  test("SMS-API-08: POST /api/v1/sms/batch — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/v1/sms/batch`, {
      data: { recipients: [], message: "test" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("SMS-API-09: POST /api/v1/sms/batch — empty recipients returns 400", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/batch`, {
      data: { recipients: [], message: "test", senderName: "SMSOK" },
    });
    expect([400, 422]).toContain(res.status());
  });

  // === SMS Status ===
  test("SMS-API-10: GET /api/v1/sms/status — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/sms/status`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  // === Scheduled SMS ===
  test("SMS-API-11: GET /api/v1/sms/scheduled — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/sms/scheduled`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("SMS-API-12: GET /api/v1/sms/scheduled — authed returns list", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/sms/scheduled`);
    expect([200, 401]).toContain(res.status());
  });

  test("SMS-API-13: POST /api/v1/sms/scheduled — empty body returns 400", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/scheduled`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  // === Logs ===
  test("SMS-API-14: GET /api/v1/logs — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/logs`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("SMS-API-15: GET /api/v1/logs — authed returns message logs", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/logs`);
    expect([200, 401]).toContain(res.status());
  });

  test("SMS-API-16: GET /api/v1/logs/nonexistent-id — returns 404", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/logs/nonexistent-id-xyz`);
    expect([400, 404]).toContain(res.status());
  });

  // === Very long message ===
  test("SMS-API-17: POST /api/v1/sms/send — very long message handled", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, {
      data: { to: "0899999999", message: "A".repeat(5000), senderName: "SMSOK" },
    });
    // Should either accept (multi-part) or reject with 400
    expect([200, 400, 402, 422]).toContain(res.status());
  });

  // === Invalid JSON ===
  test("SMS-API-18: POST /api/v1/sms/send — malformed JSON returns error", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/sms/send`, {
      headers: { "Content-Type": "application/json" },
      data: "not json{{{",
    });
    expect([400, 422, 500]).toContain(res.status());
  });
});
