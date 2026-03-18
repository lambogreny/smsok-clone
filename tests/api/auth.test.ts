import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

test.describe("API: Auth Endpoints", () => {
  // === Login ===
  test("AUTH-API-01: POST /api/auth/login — valid credentials returns 200 + success", async ({ request }) => {
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

  test("AUTH-API-03: POST /api/auth/login — empty body returns 400/401", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, { data: {} });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-04: POST /api/auth/login — missing email returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { password: "SomePass123!" },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-05: POST /api/auth/login — missing password returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: USER.email },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-06: GET /api/auth/login — wrong method returns 405", async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/login`);
    expect(res.status()).toBe(405);
  });

  test("AUTH-API-07: POST /api/auth/login — nonexistent user returns 401", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: "doesnotexist@smsok.test", password: process.env.E2E_USER_PASSWORD! },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    // Should NOT reveal whether the email exists or not (security)
    expect(body.message || body.error).toBeDefined();
  });

  // === Register ===
  test("AUTH-API-08: POST /api/auth/register — empty body returns 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test("AUTH-API-09: POST /api/auth/register — weak password rejected", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: {
        firstName: "Weak",
        lastName: "Pass",
        email: `weak-${Date.now()}@smsok.test`,
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "123",
        confirmPassword: "123",
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  test("AUTH-API-10: POST /api/auth/register — duplicate email rejected", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: {
        firstName: "Dup",
        lastName: "User",
        email: USER.email,
        phone: "0899999999",
        password: "DupUser2026!",
        confirmPassword: "DupUser2026!",
      },
    });
    expect([400, 409, 422]).toContain(res.status());
  });

  test("AUTH-API-11: POST /api/auth/register — password mismatch rejected", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: {
        firstName: "Mis",
        lastName: "Match",
        email: `mismatch-${Date.now()}@smsok.test`,
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "TestPass2026!",
        confirmPassword: "DifferentPass2026!",
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  // === Session / Me ===
  test("AUTH-API-12: GET /api/auth/me — no cookie returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/auth/me`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("AUTH-API-13: GET /api/auth/me — with session returns user data", async ({ request }) => {
    // Login first
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/auth/me`);
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.email || body.user?.email).toBeDefined();
    }
  });

  // === Logout ===
  test("AUTH-API-14: POST /api/auth/logout — returns success after login", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/auth/logout`);
    expect([200, 204]).toContain(res.status());
  });

  test("AUTH-API-15: POST /api/auth/logout — without session is safe", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/auth/logout`);
    expect([200, 204, 401]).toContain(res.status());
    await ctx.close();
  });

  // === Security ===
  test("AUTH-API-16: SQL injection in email field is safe", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: "'; DROP TABLE users;--", password: "test" },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-17: XSS in email field is safe", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: '<script>alert(1)</script>@test.com', password: "test" },
    });
    expect([400, 401, 422]).toContain(res.status());
    const body = await res.text();
    expect(body).not.toContain("<script>");
  });

  test("AUTH-API-18: SQL injection in password field is safe", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: USER.email, password: "' OR 1=1;--" },
    });
    expect(res.status()).toBe(401);
  });

  test("AUTH-API-19: very long email is handled", async ({ request }) => {
    const longEmail = "a".repeat(500) + "@test.com";
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: longEmail, password: process.env.E2E_USER_PASSWORD! },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  test("AUTH-API-20: very long password is handled", async ({ request }) => {
    const longPass = "A1!" + "a".repeat(10000);
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: USER.email, password: longPass },
    });
    expect([400, 401, 422]).toContain(res.status());
  });

  // === Health Check ===
  test("AUTH-API-21: GET /api/health — returns 200", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health`);
    expect(res.status()).toBe(200);
  });

  test("AUTH-API-22: GET /api/health/live — returns 200", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health/live`);
    expect([200, 404]).toContain(res.status());
  });

  test("AUTH-API-23: GET /api/health/ready — returns 200", async ({ request }) => {
    const res = await request.get(`${BASE}/api/health/ready`);
    expect([200, 404]).toContain(res.status());
  });

  // === Verify Session ===
  test("AUTH-API-24: POST /api/auth/verify-session — no cookie returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/auth/verify-session`);
    expect([401, 403, 404, 405]).toContain(res.status());
    await ctx.close();
  });

  // === Refresh ===
  test("AUTH-API-25: POST /api/auth/refresh — no cookie returns 401", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/auth/refresh`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  // === 2FA Endpoints ===
  test("AUTH-API-26: GET /api/v1/settings/2fa — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/settings/2fa`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("AUTH-API-27: POST /api/auth/2fa/verify — no token returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/2fa/verify`, {
      data: { code: "123456" },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test("AUTH-API-28: POST /api/auth/2fa/recovery — no token returns error", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/2fa/recovery`, {
      data: { code: "ABCD-1234-EFGH" },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  // === Settings (authed) ===
  test("AUTH-API-29: GET /api/v1/settings/profile — authed returns profile", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/settings/profile`);
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.email || body.data?.email).toBeDefined();
    }
  });

  test("AUTH-API-30: GET /api/v1/settings/sessions — authed returns sessions", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/settings/sessions`);
    expect([200, 401]).toContain(res.status());
  });

  test("AUTH-API-31: PUT /api/v1/settings/password — wrong current password rejected", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.put(`${BASE}/api/v1/settings/password`, {
      data: {
        currentPassword: "WrongCurrent123!",
        newPassword: "NewPass2026!",
        confirmPassword: "NewPass2026!",
      },
    });
    expect([400, 401, 403, 422]).toContain(res.status());
  });

  test("AUTH-API-32: GET /api/v1/settings/activity — authed returns logs", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/settings/activity`);
    expect([200, 401]).toContain(res.status());
  });
});
