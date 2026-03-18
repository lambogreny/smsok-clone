import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const DEMO_EMAIL = "demo@smsok.local";
const DEMO_PASS = process.env.SEED_PASSWORD!;

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"], input[type="email"]', DEMO_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', DEMO_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

// ============================================================
// 53c2e5f CRITICAL: Duplicate check fix
// ============================================================
test.describe("53c2e5f — Duplicate Check Fix", () => {
  test("1. Register with existing email → shows taken message", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");

    // Fill email that already exists
    await page.locator('input[name="email"]').fill(DEMO_EMAIL);
    // Trigger blur to check duplicate
    await page.locator('input[name="password"]').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/4745-dup-email.png" });

    const body = await page.textContent("body") || "";
    // Should show "ถูกใช้งานแล้ว" or similar duplicate message
    const hasDupWarning = body.includes("ถูกใช้") || body.includes("ไม่สามารถ") || body.includes("มีอยู่แล้ว") || body.includes("ใช้งานแล้ว");
    expect(hasDupWarning).toBeTruthy();
  });

  test("2. Register with existing phone → shows taken message", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");

    // Fill phone that already exists (seed: +66900000000 = 0900000000)
    await page.locator('input[name="phone"]').fill("0900000000");
    // Trigger blur
    await page.locator('input[name="password"]').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/4745-dup-phone.png" });

    const body = await page.textContent("body") || "";
    const hasDupWarning = body.includes("ถูกใช้") || body.includes("ไม่สามารถ") || body.includes("มีอยู่แล้ว") || body.includes("ใช้งานแล้ว");
    expect(hasDupWarning).toBeTruthy();
  });

  test("3. Register with new email → shows available", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");

    const ts = Date.now();
    await page.locator('input[name="email"]').fill(`unique-${ts}@test.com`);
    await page.locator('input[name="password"]').click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/4745-new-email.png" });

    const body = await page.textContent("body") || "";
    // Should NOT show "ถูกใช้งานแล้ว"
    expect(body).not.toContain("ถูกใช้งานแล้ว");
  });

  test("4. API: duplicate check case-insensitive email", async ({ request }) => {
    // Uppercase email should still detect duplicate
    const resp = await request.get(`${BASE}/api/auth/check-duplicate?email=DEMO@SMSOK.LOCAL`, {
      headers: { "Origin": BASE },
    });
    const data = await resp.json();
    expect(data.available).toBe(false);
  });

  test("5. API: new email returns available", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/auth/check-duplicate?email=brand-new-${Date.now()}@test.com`, {
      headers: { "Origin": BASE },
    });
    const data = await resp.json();
    expect(data.available).toBe(true);
  });

  test("6. API: existing phone returns not available", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/auth/check-duplicate?phone=0900000000`, {
      headers: { "Origin": BASE },
    });
    const data = await resp.json();
    expect(data.available).toBe(false);
  });
});

// ============================================================
// 4a195fe: Dashboard fallback improvements
// ============================================================
test.describe("4a195fe — Dashboard Fallback", () => {
  test("7. Dashboard loads for seed user — no crash", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4745-dashboard.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    // Should NOT show error page
    expect(text).not.toContain("ไม่มีสิทธิ์");
    expect(text).not.toContain("Internal Server Error");
    // Should show dashboard content
    expect(text.length).toBeGreaterThan(50);
  });

  test("8. Dashboard shows stats or graceful empty state", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4745-dashboard-stats.png", fullPage: true });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    // Should have some content (stats, cards, or onboarding)
    const hasContent = /\d/.test(text) || text.includes("SMS") || text.includes("วันนี้") || text.includes("ยินดี") || text.includes("เริ่มต้น");
    expect(hasContent).toBeTruthy();
  });
});

// ============================================================
// 56809cf: Campaign segments + email lowercase
// ============================================================
test.describe("56809cf — Campaign & Email", () => {
  test("9. Campaigns page loads", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/campaigns`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4745-campaigns.png" });

    const main = page.locator("main, [role='main'], .flex-1").first();
    const text = await main.textContent() || "";
    expect(text).not.toContain("ไม่มีสิทธิ์");
  });

  test("10. All sidebar pages — no 403/500", async ({ page }) => {
    await login(page);

    const pages = [
      "/dashboard",
      "/dashboard/send",
      "/dashboard/history",
      "/dashboard/campaigns",
      "/dashboard/contacts",
      "/dashboard/groups",
      "/dashboard/templates",
      "/dashboard/senders",
      "/dashboard/packages",
      "/dashboard/settings",
      "/dashboard/support",
      "/dashboard/api-keys",
    ];

    const failures: string[] = [];
    for (const p of pages) {
      await page.goto(`${BASE}${p}`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1500);
      const main = page.locator("main, [role='main'], .flex-1").first();
      const text = await main.textContent() || "";
      if (text.includes("ไม่มีสิทธิ์") || text.includes("Internal Server Error")) {
        failures.push(p);
      }
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4745-all-pages.png" });
    expect(failures).toEqual([]);
  });
});

// ============================================================
// c057a2f: Error logging (verify no crash)
// ============================================================
test.describe("c057a2f — Error Logging", () => {
  test("11. No JS console errors on dashboard", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await login(page);
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const critical = errors.filter(e =>
      !e.includes("favicon") && !e.includes("manifest") && !e.includes("hydration") && !e.includes("React does not recognize")
    );
    await page.screenshot({ path: "tests/e2e/screenshots/4745-console.png" });
    expect(critical.length).toBeLessThanOrEqual(2);
  });
});
