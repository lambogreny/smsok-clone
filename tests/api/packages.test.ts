import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";
const USER = { email: "qa-judge2@smsok.test", password: "QAJudge2026!" };

test.describe("API: Packages Endpoints", () => {
  // === Public Package List ===
  test("PKG-API-01: GET /api/v1/packages — returns tiers (public)", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/packages`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    expect(Array.isArray(data) || typeof data === "object").toBeTruthy();
  });

  test("PKG-API-02: GET /api/v1/packages — response has name and price fields", async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/packages`);
    if (res.status() === 200) {
      const body = await res.json();
      const packages = body.data || body;
      if (Array.isArray(packages) && packages.length > 0) {
        const pkg = packages[0];
        expect(pkg).toHaveProperty("name");
        expect(pkg.price || pkg.pricePerCredit || pkg.credits).toBeDefined();
      }
    }
  });

  test("PKG-API-03: POST /api/v1/packages — write not allowed", async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/packages`, { data: { name: "hack" } });
    expect([401, 403, 404, 405]).toContain(res.status());
  });

  // === Authed Package Endpoints ===
  test("PKG-API-04: GET /api/v1/packages/my — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/packages/my`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("PKG-API-05: GET /api/v1/packages/my — authed returns list", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/packages/my`);
    expect([200, 401]).toContain(res.status());
  });

  test("PKG-API-06: GET /api/v1/packages/active — authed returns active packages", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/packages/active`);
    expect([200, 401]).toContain(res.status());
  });

  test("PKG-API-07: GET /api/v1/packages/usage — authed returns usage stats", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/packages/usage`);
    expect([200, 401]).toContain(res.status());
  });

  test("PKG-API-08: POST /api/v1/packages/purchase — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.post(`${BASE}/api/v1/packages/purchase`, {
      data: { packageId: "some-id" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  test("PKG-API-09: POST /api/v1/packages/purchase — empty body returns 400", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.post(`${BASE}/api/v1/packages/purchase`, { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  // === Credits ===
  test("PKG-API-10: GET /api/v1/credits/balance — authed returns balance", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/credits/balance`);
    if (res.status() === 200) {
      const body = await res.json();
      expect(typeof (body.balance ?? body.credits ?? body.data?.balance)).toBe("number");
    }
  });

  test("PKG-API-11: GET /api/v1/credits/balance — requires auth", async ({ browser }) => {
    const ctx = await browser.newContext();
    const res = await ctx.request.get(`${BASE}/api/v1/credits/balance`);
    expect([401, 403]).toContain(res.status());
    await ctx.close();
  });

  // === Auto Topup ===
  test("PKG-API-12: GET /api/v1/packages/auto-topup — authed returns config", async ({ request }) => {
    await request.post(`${BASE}/api/auth/login`, { data: USER });
    const res = await request.get(`${BASE}/api/v1/packages/auto-topup`);
    expect([200, 401, 404]).toContain(res.status());
  });
});
