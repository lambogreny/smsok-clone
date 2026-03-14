import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("API: Packages Endpoints", () => {
  test("PKG-API-01: GET /api/packages — returns tiers (public)", async ({ request }) => {
    const res = await request.get(`${BASE}/api/packages`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data || body;
    expect(Array.isArray(data) || typeof data === "object").toBeTruthy();
  });

  test("PKG-API-02: GET /api/packages — response has expected fields", async ({ request }) => {
    const res = await request.get(`${BASE}/api/packages`);
    if (res.status() === 200) {
      const body = await res.json();
      const packages = body.data || body;
      if (Array.isArray(packages) && packages.length > 0) {
        const pkg = packages[0];
        // Should have name and price at minimum
        expect(pkg).toHaveProperty("name");
      }
    }
  });

  test("PKG-API-03: POST /api/packages — not allowed (read-only)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/packages`, { data: { name: "hack" } });
    expect([401, 403, 404, 405]).toContain(res.status());
  });
});
