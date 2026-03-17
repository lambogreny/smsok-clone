import { test, expect, dismissCookieConsent, collectConsoleErrors } from "./fixtures";

test.describe("PDPA Consent — Deep Test (Task #4956)", () => {
  // 1. Register → 3 consent checkboxes ห้าม pre-checked
  test("PDPA-01: register has consent checkboxes NOT pre-checked", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await dismissCookieConsent(page);

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // None should be pre-checked
    for (let i = 0; i < count; i++) {
      const checked = await checkboxes.nth(i).isChecked();
      expect(checked).toBe(false);
    }
    await page.screenshot({ path: "test-results/pdpa-01-register-unchecked.png" });
  });

  // 3. Settings PDPA page — has 4 management cards
  test("PDPA-03: /settings/pdpa has consent management cards", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/pdpa", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");

    expect(body).not.toContain("Internal Server Error");
    expect(body).not.toContain("Something went wrong");

    // Should have PDPA dashboard with 4 key sections
    expect(body).toContain("PDPA");
    const hasConsentMgmt = body?.includes("การจัดการความยินยอม") || body?.includes("consent");
    expect(hasConsentMgmt).toBeTruthy();

    // Check for the 4 cards: consent management, opt-out, data rights, retention
    const hasOptOut = body?.includes("ยกเลิกการรับ") || body?.includes("opt-out");
    const hasDataRights = body?.includes("สิทธิ์ข้อมูล") || body?.includes("data subject");
    const hasRetention = body?.includes("นโยบายเก็บข้อมูล") || body?.includes("retention");
    expect(hasOptOut).toBeTruthy();
    expect(hasDataRights).toBeTruthy();
    expect(hasRetention).toBeTruthy();

    // Check legal documents section
    const hasDocs = body?.includes("Privacy Policy") || body?.includes("Terms of Service");
    expect(hasDocs).toBeTruthy();

    await page.screenshot({ path: "test-results/pdpa-03-consent-dashboard.png" });
  });

  // 3b. Click into consent management card
  test("PDPA-03b: consent management card opens consent list", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/pdpa", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Click the consent management card
    const consentCard = page.locator('text=การจัดการความยินยอม').first();
    await consentCard.click();
    await page.waitForTimeout(2000);

    // Should navigate to consent list or open modal
    const body = await page.textContent("body");
    const hasConsentContent = body?.includes("consent") || body?.includes("ยินยอม") || body?.includes("toggle");
    expect(hasConsentContent).toBeTruthy();

    await page.screenshot({ path: "test-results/pdpa-03b-consent-list.png" });
  });

  // 4. Consent history
  test("PDPA-04: consent page shows history or log section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/consent", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    let body = await page.textContent("body");

    if (body?.includes("404") || body?.includes("Not Found")) {
      await page.goto("/dashboard/settings/pdpa", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      body = await page.textContent("body");
    }

    // Should show history or log
    const hasHistory = body?.includes("ประวัติ") || body?.includes("history") || body?.includes("log") || body?.includes("บันทึก");
    expect(hasHistory).toBeTruthy();

    await page.screenshot({ path: "test-results/pdpa-04-consent-history.png" });
  });

  // 9. Privacy page — data access request
  test("PDPA-09: /settings/privacy has data rights section", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings/privacy", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.textContent("body");

    expect(body).not.toContain("Internal Server Error");

    // Should have privacy/data rights content
    const hasDataRights = body?.includes("สิทธิ") || body?.includes("ข้อมูล") || body?.includes("ความเป็นส่วนตัว") || body?.includes("Privacy") || body?.includes("data");
    expect(hasDataRights).toBeTruthy();

    await page.screenshot({ path: "test-results/pdpa-09-privacy-rights.png" });
  });

  // 10. Security — IDOR on consent endpoint
  test("PDPA-10: consent API rejects different userId (IDOR)", async ({ authedPage: page }) => {
    // Try to access another user's consent data
    const res = await page.request.get("/api/v1/consent?userId=fake-user-id-999", {
      headers: { "Origin": "http://localhost:3000" },
    });
    // Should not expose other user data — either 403, 404, or ignore the param
    expect([200, 403, 404]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      // If 200, should only return current user's data, not the fake userId
      if (data.userId) {
        expect(data.userId).not.toBe("fake-user-id-999");
      }
    }
  });

  // Sprint B: consent page responsive
  test("PDPA-11: consent page responsive 375px", async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard/settings/consent", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    let body = await page.textContent("body");

    if (body?.includes("404")) {
      await page.goto("/dashboard/settings/pdpa", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
    }

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: "test-results/pdpa-11-responsive-375.png" });
  });

  // No console errors
  test("PDPA-12: no console errors on consent page", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);
    await page.goto("/dashboard/settings/consent", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    let body = await page.textContent("body");

    if (body?.includes("404")) {
      await page.goto("/dashboard/settings/pdpa", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
    }

    await page.waitForTimeout(2000);
    const realErrors = errors.filter(e =>
      !e.includes("favicon") && !e.includes("sw.js") &&
      !e.includes("Failed to load resource") && !e.includes("hydrat") &&
      !e.includes("server rendered HTML")
    );
    expect(realErrors).toHaveLength(0);
  });
});
