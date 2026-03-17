/**
 * Task #5988 Part A — UTM Tracking Test Prep
 *
 * Test cases prepared for when backend-2 #5781 (UTM tracking) is complete.
 * These tests will verify:
 * - UTM params captured on signup/login pages
 * - UTM data stored in DB via registration
 * - Admin UTM analytics endpoints
 * - Conversion funnel tracking
 *
 * Status: PREPARED — waiting for backend-2 to complete UTM feature
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const QA_EMAIL = "qa-suite@smsok.test";
const QA_PASS = "QATest123!";

// UTM test params
const UTM_PARAMS = "utm_source=google&utm_medium=cpc&utm_campaign=spring2026&utm_term=sms+api&utm_content=hero-banner";

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email: QA_EMAIL, password: QA_PASS }),
  });
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

// ═══════════════════════════════════════
// UTM Tracking Tests — PREPARED
// ═══════════════════════════════════════

test.describe("UTM Tracking — Prep Tests", () => {
  let cookie: string;
  test.beforeAll(async () => { cookie = await getSessionCookie(); });

  // ─── U1: Register page preserves UTM params ───
  test("U1: Register page loads with UTM params in URL", async ({ page }) => {
    await page.goto(`${BASE}/register?${UTM_PARAMS}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Verify UTM params are in the URL
    const url = page.url();
    expect(url).toContain("utm_source=google");
    console.log(`📍 Register URL with UTM: ${url}`);
    console.log(`✅ UTM params preserved in register URL`);
  });

  // ─── U2: Login page preserves UTM params ───
  test("U2: Login page loads with UTM params", async ({ page }) => {
    await page.goto(`${BASE}/login?${UTM_PARAMS}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const url = page.url();
    expect(url).toContain("utm_source=google");
    console.log(`✅ UTM params preserved in login URL`);
  });

  // ─── U3: Registration with UTM → check if stored ───
  test("U3: Register with UTM params → API accepts", async () => {
    const uniqueEmail = `qa-utm-${Date.now()}@test.com`;
    const res = await fetch(`${BASE}/api/auth/register?${UTM_PARAMS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({
        email: uniqueEmail,
        password: "Test123456!",
        phone: `08${Math.floor(10000000 + Math.random() * 90000000)}`,
        firstName: "UTM", lastName: "Test",
      }),
    });
    console.log(`📍 Register with UTM → ${res.status}`);
    // Registration may succeed or fail for other reasons — just check it doesn't break
    expect(res.status).not.toBe(500);
    console.log(`✅ Register with UTM params doesn't break`);
  });

  // ─── U4: Admin UTM stats endpoint (when available) ───
  test.skip("U4: GET /api/admin/marketing/utm-stats → (waiting for backend)", async () => {
    // TODO: Enable when backend-2 #5781 completes UTM tracking
    const res = await fetch(`${BASE}/api/admin/marketing/utm-stats`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("stats");
  });

  // ─── U5: Admin conversions endpoint (when available) ───
  test.skip("U5: GET /api/admin/marketing/conversions → (waiting for backend)", async () => {
    // TODO: Enable when backend-2 #5781 completes UTM tracking
    const res = await fetch(`${BASE}/api/admin/marketing/conversions`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("conversions");
  });

  // ─── U6: UTM edge cases ───
  test("U6: UTM with special characters doesn't break", async ({ page }) => {
    const specialUTM = "utm_source=goo%20gle&utm_campaign=spring%26summer&utm_content=%3Cscript%3E";
    await page.goto(`${BASE}/register?${specialUTM}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Page should not crash
    const hasForm = await page.locator('input[type="email"]').count();
    expect(hasForm).toBeGreaterThan(0);
    console.log(`✅ UTM with special chars doesn't break page`);
  });

  // ─── U7: Empty UTM params ───
  test("U7: Empty UTM params → no error", async ({ page }) => {
    await page.goto(`${BASE}/register?utm_source=&utm_medium=&utm_campaign=`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    const hasForm = await page.locator('input[type="email"]').count();
    expect(hasForm).toBeGreaterThan(0);
    console.log(`✅ Empty UTM params → page works`);
  });
});
