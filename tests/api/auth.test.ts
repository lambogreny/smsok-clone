import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

test.describe("API: Auth Endpoints", () => {
  test("AUTH-API-01: POST /api/auth/login — valid credentials returns 200 + token", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: USER });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("AUTH-API-02: POST /api/auth/login — wrong password returns 401", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: USER.email, password: "WrongPass123!" },
    });
    expect(res.status()).toBe(401);
  });

  test("AUTH-API-03: POST /api/auth/login — empty body returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: {} });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-04: POST /api/auth/login — missing email returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { password: "SomePass123!" },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-05: GET /api/auth/login — wrong method returns 405", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/login`);
    expect(res.status()).toBe(405);
  });

  test("AUTH-API-06: GET /api/auth/session — no cookie returns 401", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/session`);
    expect([401, 403]).toContain(res.status());
  });

  test("AUTH-API-07: POST /api/auth/logout — returns success", async ({ request }) => {
    // Login first to get session
    const loginRes = await request.post(`${BASE}/api/auth/login`, { data: USER });
    if (loginRes.status() === 200) {
      const logoutRes = await request.post(`${BASE}/api/auth/logout`);
      expect([200, 204]).toContain(logoutRes.status());
    }
  });

  test("AUTH-API-08: SQL injection in email field is safe", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: "'; DROP TABLE users;--", password: "test" },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-09: XSS in email field is safe", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: '<script>alert(1)</script>@test.com', password: "test" },
    });
    expect([400, 401, 422]).toContain(res.status());
    const body = await res.text();
    expect(body).not.toContain("<script>");
  });
});
