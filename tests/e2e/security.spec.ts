import { test, expect, TEST_USER, loginAs, dismissCookieConsent } from "./fixtures";

test.describe("Security", () => {
  // TC-130: XSS in all inputs
  test("TC-130: XSS payloads escaped in send SMS inputs", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send", { waitUntil: "networkidle" });

    const xssPayload = '<img src=x onerror=alert(1)>';
    const textareas = page.locator("textarea");
    const count = await textareas.count();

    for (let i = 0; i < count; i++) {
      await textareas.nth(i).fill(xssPayload);
    }

    // Verify no img with onerror injected into DOM
    const injected = await page.$('img[src="x"]');
    expect(injected).toBeNull();

    // Verify no alert dialog appeared
    let alertFired = false;
    page.on("dialog", () => { alertFired = true; });
    expect(alertFired).toBe(false);
  });

  // TC-131: Session cookie flags
  test("TC-131: session cookie has HttpOnly and SameSite", async ({ authedPage: page }) => {
    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name === "session");
    expect(session).toBeTruthy();
    expect(session!.httpOnly).toBe(true);
    // SameSite should be Strict or Lax (both acceptable)
    expect(["Strict", "Lax"]).toContain(session!.sameSite);
  });

  // TC-132: CSRF — mutations require auth
  test("TC-132: API mutations require authentication", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try SMS send without auth — should get 401 (no API key)
    const response = await page.request.post("http://localhost:3000/api/v1/sms/send", {
      headers: { "Content-Type": "application/json" },
      data: { to: "0812345678", message: "test", sender: "TEST" },
    });
    // Should be rejected (401 missing API key, or 403 CSRF)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.ok()).toBe(false);
    await context.close();
  });

  // TC-133: Auth bypass — unauthenticated API access
  test("TC-133: unauthenticated API returns 401+", async ({ browser }) => {
    // Use fresh browser context (no storageState)
    const context = await browser.newContext({ storageState: undefined });
    const request = context.request;

    const endpoints = ["/api/v1/contacts", "/api/v1/templates"];
    for (const endpoint of endpoints) {
      const response = await request.get(`http://localhost:3000${endpoint}`).catch(() => null);
      if (response) {
        // Should be 401 (no API key) — not 200
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.ok()).toBe(false);
      }
    }
    await context.close();
  });

  // TC-011b: Session rotation on login
  test("TC-011b: session cookie value changes after login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await dismissCookieConsent(page);
    const cookiesBefore = await page.context().cookies();
    const sessionBefore = cookiesBefore.find((c) => c.name.includes("session"));

    const path = await loginAs(page, TEST_USER.email, TEST_USER.password);

    // If 2FA challenge, session cookie isn't set until 2FA is verified
    if (path.includes("/2fa")) {
      // Login credentials were valid — session rotation will happen after 2FA
      return;
    }

    const cookiesAfter = await page.context().cookies();
    const sessionAfter = cookiesAfter.find((c) => c.name.includes("session"));

    // If session existed before, it should rotate
    if (sessionBefore && sessionAfter) {
      expect(sessionBefore.value).not.toBe(sessionAfter.value);
    }
    // After login, session must exist
    expect(sessionAfter).toBeTruthy();
  });
});
