import { test as base, expect } from "@playwright/test";
import { test, dismissCookieConsent, TEST_USER, loginAs } from "./fixtures";

const SCREENSHOT_DIR = "tests/screenshots/task-6302";

// Unauthenticated test (no storageState)
const noAuthTest = base;

noAuthTest.describe("Security — Auth Bypass (No Auth)", () => {
  noAuthTest("1.1 Dashboard redirect to login without auth", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000); // Wait for client-side redirect

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-auth-bypass-dashboard.png`, fullPage: true });

    const url = page.url();
    const body = await page.textContent("body");

    // Should redirect to login or show login page
    const isOnLogin = url.includes("/login");
    const showsLoginForm = body?.includes("เข้าสู่ระบบ") || body?.includes("login");
    const showsDashboardData = body?.includes("ภาพรวม") || body?.includes("SMS ทั้งหมด");

    console.log(`URL after navigation: ${url}`);
    console.log(`Shows dashboard data: ${showsDashboardData}`);
    console.log(`Shows login form: ${showsLoginForm}`);

    // CRITICAL: Must not show dashboard content without auth
    if (showsDashboardData && !isOnLogin) {
      console.error("🔴 CRITICAL: Dashboard content visible without authentication!");
    }

    // Should be on login page
    expect(isOnLogin || showsLoginForm).toBe(true);
  });

  noAuthTest("1.2 Settings redirect to login without auth", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-auth-bypass-settings.png`, fullPage: true });

    const url = page.url();
    expect(url).toContain("/login");
  });

  noAuthTest("1.3 API Keys redirect to login without auth", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/api-keys", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-auth-bypass-apikeys.png`, fullPage: true });

    const url = page.url();
    expect(url).toContain("/login");
  });

  noAuthTest("1.4 Contacts redirect to login without auth", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard/contacts", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-auth-bypass-contacts.png`, fullPage: true });

    const url = page.url();
    expect(url).toContain("/login");
  });
});

test.describe("Security — XSS (Authenticated)", () => {
  test("3.1 XSS in template content — script not executed", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    // Create template with XSS payload via API
    const response = await page.request.post("/api/v1/templates", {
      data: {
        name: "XSS Security Test",
        content: '<img src=x onerror=alert(document.cookie)>',
        category: "general",
      },
      headers: { Origin: "http://localhost:3000" },
    });

    console.log(`Template create status: ${response.status()}`);
    const body = await response.json().catch(() => ({}));
    console.log(`Template create response: ${JSON.stringify(body).substring(0, 200)}`);

    // Check if template was created with raw XSS
    if (response.ok()) {
      // Navigate to templates page and check if XSS is escaped in UI
      await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

      // Check for alert dialog (XSS execution)
      let alertFired = false;
      page.on("dialog", (dialog) => {
        alertFired = true;
        dialog.dismiss();
      });

      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-xss-template.png`, fullPage: true });

      if (alertFired) {
        console.error("🔴 CRITICAL: XSS payload executed! Alert dialog fired!");
      }

      // Check if raw HTML is visible in page source
      const pageContent = await page.content();
      const hasRawScript = pageContent.includes('<img src=x onerror=alert');
      const hasEscaped = pageContent.includes('&lt;img') || pageContent.includes('&lt;script');

      console.log(`Raw XSS in page: ${hasRawScript}`);
      console.log(`Escaped XSS in page: ${hasEscaped}`);

      expect(alertFired).toBe(false);
    }
  });

  test("3.2 XSS in profile name — script not stored", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    // Try XSS via profile update
    const response = await page.request.put("/api/v1/settings/profile", {
      data: { name: '<script>alert("xss")</script>' },
      headers: { Origin: "http://localhost:3000" },
    });

    console.log(`Profile XSS update status: ${response.status()}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-xss-profile.png`, fullPage: true });

    // Should reject or sanitize
    if (response.ok()) {
      // Reload and check
      await page.goto("/dashboard/settings", { waitUntil: "networkidle" });
      const body = await page.textContent("body");
      const hasRawScript = body?.includes('<script>alert');
      console.log(`Raw script in settings page: ${hasRawScript}`);
      expect(hasRawScript).toBe(false);
    }
  });
});

test.describe("Security — Session & CSRF (Authenticated)", () => {
  test("6.1 Session invalidation after logout", async ({ authedPage: page }) => {
    // Get current session info
    const beforeLogout = await page.request.get("/api/v1/settings/profile");
    expect(beforeLogout.status()).toBe(200);

    // Logout
    const logoutResp = await page.request.post("/api/auth/logout", {
      headers: { Origin: "http://localhost:3000" },
    });
    console.log(`Logout status: ${logoutResp.status()}`);

    // Try accessing protected endpoint after logout
    const afterLogout = await page.request.get("/api/v1/settings/profile");
    console.log(`After logout profile status: ${afterLogout.status()}`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-session-logout.png`, fullPage: true });

    expect(afterLogout.status()).toBe(401);
  });
});
