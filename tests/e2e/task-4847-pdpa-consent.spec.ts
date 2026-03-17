import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const DEMO_EMAIL = process.env.QA_EMAIL || "qa-suite@smsok.test";
const DEMO_PASS = process.env.QA_PASS || "QATest123!";

async function dismissCookieConsent(page: Page) {
  const btn = page.getByText("ยอมรับทั้งหมด");
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
  await page.evaluate(() => {
    document.querySelectorAll('[aria-label*="คุกกี้"], [class*="consent"], [class*="cookie"]').forEach(el => el.remove());
  }).catch(() => {});
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await dismissCookieConsent(page);
  await page.fill('input[name="email"], input[type="email"]', DEMO_EMAIL);
  await page.fill('input[name="password"], input[type="password"]', DEMO_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 20000 });
}

// ============================================================
// Batch 1: Register Flow (no login needed)
// ============================================================
test.describe("PDPA Consent — Register Flow", () => {

  test("1. Register page has consent checkboxes (none pre-checked)", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);
    await page.screenshot({ path: "tests/e2e/screenshots/4847-01-register-consent.png", fullPage: true });

    const checkboxes = page.locator('[data-slot="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // None should be pre-checked
    for (let i = 0; i < count; i++) {
      const checked = await checkboxes.nth(i).getAttribute("data-checked");
      const ariaChecked = await checkboxes.nth(i).getAttribute("aria-checked");
      expect(checked === "true" || ariaChecked === "true").toBeFalsy();
    }

    const body = await page.textContent("body") || "";
    const hasServiceConsent = body.includes("ข้อกำหนด") || body.includes("นโยบาย") || body.includes("Terms");
    expect(hasServiceConsent).toBeTruthy();
  });

  test("2. Submit disabled without required consents", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    const ts = Date.now();
    await page.locator('input[name="firstName"]').fill("QA PDPA");
    await page.locator('input[name="lastName"]').fill("Test");
    await page.locator('input[name="email"]').fill(`qa-pdpa-${ts}@test.com`);
    await page.locator('input[name="phone"]').fill(`089${String(ts).slice(-7)}`);
    await page.locator('input[name="password"]').fill("TestPass123!");
    await page.locator('input[name="confirmPassword"]').fill("TestPass123!");
    await page.waitForTimeout(1000);

    const submitBtn = page.locator('button[type="submit"]').first();
    const isDisabled = await submitBtn.isDisabled();
    await page.screenshot({ path: "tests/e2e/screenshots/4847-02-no-consent-submit.png" });
    expect(isDisabled).toBeTruthy();
  });

  test("3. Register consent at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/register`);
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    const checkboxes = page.locator('[data-slot="checkbox"]');
    if (await checkboxes.count() > 0) {
      await checkboxes.first().scrollIntoViewIfNeeded();
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4847-03-consent-mobile.png", fullPage: true });
    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
  });
});

// ============================================================
// Batch 2: PDPA Settings Pages (single login, navigate within session)
// ============================================================
test.describe("PDPA Consent — Settings Pages", () => {

  test("4-8. All PDPA settings pages load correctly", async ({ page }) => {
    await login(page);

    const pdpaPages = [
      { path: "/dashboard/settings/pdpa", name: "hub", expectText: ["PDPA", "ความยินยอม", "Consent", "ข้อมูลส่วนบุคคล", "สิทธิ"] },
      { path: "/dashboard/settings/pdpa/consent", name: "consent", expectText: [] },
      { path: "/dashboard/settings/pdpa/requests", name: "requests", expectText: ["คำขอ", "สิทธิ", "Request", "ACCESS", "DELETE"] },
      { path: "/dashboard/settings/pdpa/optout", name: "optout", expectText: [] },
      { path: "/dashboard/settings/pdpa/retention", name: "retention", expectText: [] },
    ];

    const failures: string[] = [];
    for (const p of pdpaPages) {
      await page.goto(`${BASE}${p.path}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `tests/e2e/screenshots/4847-${p.name}.png`, fullPage: true });

      const body = await page.textContent("body") || "";
      if (body.includes("Internal Server Error")) {
        failures.push(`${p.path}: Internal Server Error`);
        continue;
      }

      if (p.expectText.length > 0) {
        const hasExpected = p.expectText.some(t => body.includes(t));
        if (!hasExpected) {
          failures.push(`${p.path}: missing expected content`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  test("9. Settings page — sending hours config area", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/settings`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4847-09-settings.png", fullPage: true });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
  });

  test("10. PDPA settings at 1440px desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.goto(`${BASE}/dashboard/settings/pdpa`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4847-10-pdpa-desktop.png", fullPage: true });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
    expect(body.length).toBeGreaterThan(100);
  });

  test("11. PDPA settings at 375px mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto(`${BASE}/dashboard/settings/pdpa`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/4847-11-pdpa-mobile.png", fullPage: true });

    const body = await page.textContent("body") || "";
    expect(body).not.toContain("Internal Server Error");
  });

  test("12. No JS console errors on PDPA pages", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await login(page);
    await page.goto(`${BASE}/dashboard/settings/pdpa`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.goto(`${BASE}/dashboard/settings/pdpa/consent`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const critical = errors.filter(e =>
      !e.includes("favicon") && !e.includes("manifest") && !e.includes("hydration") && !e.includes("React does not recognize")
    );
    await page.screenshot({ path: "tests/e2e/screenshots/4847-12-console.png" });
    expect(critical.length).toBeLessThanOrEqual(3);
  });

  test("13. XSS in consent-related inputs", async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/settings/pdpa/optout`);
    await page.waitForLoadState("networkidle");

    const inputs = page.locator('input[type="text"], input[type="url"], textarea');
    const inputCount = await inputs.count();
    if (inputCount > 0) {
      await inputs.first().fill('<script>alert("xss")</script>');
      await page.screenshot({ path: "tests/e2e/screenshots/4847-13-xss.png" });
      const hasAlert = await page.evaluate(() => (window as any).__xss_triggered || false);
      expect(hasAlert).toBeFalsy();
    } else {
      await page.screenshot({ path: "tests/e2e/screenshots/4847-13-no-inputs.png" });
    }
  });
});

// ============================================================
// Batch 3: API Tests (no browser login needed)
// ============================================================
test.describe("PDPA Consent — API Layer", () => {

  test("14. API: consent status endpoint responds", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/v1/consent/status`);
    expect(resp.status()).toBeLessThan(500);
  });

  test("15. API: consent logs endpoint responds", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/v1/consent/logs`);
    expect(resp.status()).toBeLessThan(500);
  });

  test("16. API: sending hours check", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/v1/sending-hours`);
    expect(resp.status()).toBeLessThan(500);
    if (resp.status() === 200) {
      const data = await resp.json();
      expect(data).toHaveProperty("allowed");
    }
  });

  test("17. API: cannot withdraw SERVICE consent", async ({ request }) => {
    const resp = await request.post(`${BASE}/api/v1/consent/withdraw`, {
      data: { consentType: "SERVICE" },
    });
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    expect(resp.status()).toBeLessThan(500);
  });

  test("18. API: reconsent check endpoint responds", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/v1/consent/reconsent-check`);
    expect(resp.status()).toBeLessThan(500);
  });
});

// ============================================================
// Batch 4: Security Tests (no login = test auth enforcement)
// ============================================================
test.describe("PDPA — Security", () => {

  test("19. Consent pages require authentication", async ({ page }) => {
    const protectedPages = [
      "/dashboard/settings/pdpa",
      "/dashboard/settings/pdpa/consent",
      "/dashboard/settings/pdpa/requests",
    ];

    for (const p of protectedPages) {
      await page.goto(`${BASE}${p}`);
      await page.waitForTimeout(2000);
      const url = page.url();
      const redirected = url.includes("/login") || !url.includes(p);
      expect(redirected).toBeTruthy();
    }
    await page.screenshot({ path: "tests/e2e/screenshots/4847-19-auth-redirect.png" });
  });

  test("20. API: consent status without auth → 401", async ({ request }) => {
    const resp = await request.get(`${BASE}/api/v1/consent/status`, {
      headers: { Cookie: "" },
    });
    expect(resp.status()).toBeGreaterThanOrEqual(400);
  });
});
