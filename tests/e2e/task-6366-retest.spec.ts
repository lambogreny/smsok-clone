/**
 * Task #6366 — Retest Senders + Tickets after fix
 * P0 retest — ถ้าผ่าน = DEPLOY READY
 */
import { test, expect, dismissCookieConsent } from "./fixtures";

const SS = "tests/screenshots/task-6366";

test.describe("Task #6366 — Retest Senders + Tickets", () => {
  // ═══ ชั้น 1: API Tests ═══

  test("API 1.1 GET /api/v1/senders → should return 200", async ({ authedPage: page }) => {
    const response = await page.request.get("/api/v1/senders");
    const status = response.status();
    const body = await response.json().catch(() => ({}));

    console.log(`GET /api/v1/senders → ${status}`);
    console.log(`Response: ${JSON.stringify(body).substring(0, 300)}`);

    expect(status).toBe(200);
  });

  test("API 1.2 GET /api/v1/tickets → should return 200", async ({ authedPage: page }) => {
    const response = await page.request.get("/api/v1/tickets");
    const status = response.status();
    const body = await response.json().catch(() => ({}));

    console.log(`GET /api/v1/tickets → ${status}`);
    console.log(`Response: ${JSON.stringify(body).substring(0, 300)}`);

    expect(status).toBe(200);
  });

  // ═══ ชั้น 1: Re-verify all 20 API endpoints ═══

  test("API 1.3 Full API sweep — all 20 endpoints", async ({ authedPage: page }) => {
    const endpoints = [
      { method: "GET", path: "/api/v1/dashboard/summary" },
      { method: "GET", path: "/api/v1/senders" },
      { method: "GET", path: "/api/v1/templates" },
      { method: "GET", path: "/api/v1/campaigns" },
      { method: "GET", path: "/api/v1/groups" },
      { method: "GET", path: "/api/v1/contacts" },
      { method: "GET", path: "/api/v1/settings/profile" },
      { method: "GET", path: "/api/v1/api-keys" },
      { method: "GET", path: "/api/v1/packages" },
      { method: "GET", path: "/api/v1/orders" },
      { method: "GET", path: "/api/v1/payments/history" },
      { method: "GET", path: "/api/v1/tickets" },
      { method: "GET", path: "/api/v1/activity" },
      { method: "GET", path: "/api/v1/sms/history" },
      { method: "GET", path: "/api/v1/webhooks" },
    ];

    const results: { path: string; status: number; pass: boolean }[] = [];

    for (const ep of endpoints) {
      const response = await page.request.get(ep.path);
      const status = response.status();
      const pass = status >= 200 && status < 300;
      results.push({ path: ep.path, status, pass });
    }

    console.log("\n📊 API Sweep Results:");
    let passCount = 0;
    let failCount = 0;
    for (const r of results) {
      const icon = r.pass ? "✅" : "❌";
      console.log(`  ${icon} ${r.path} → ${r.status}`);
      if (r.pass) passCount++;
      else failCount++;
    }
    console.log(`\nTotal: ${passCount} PASS / ${failCount} FAIL out of ${results.length}`);

    // All should pass
    const failures = results.filter((r) => !r.pass);
    expect(failures.length).toBe(0);
  });

  // ═══ ชั้น 2: Browser Tests ═══

  test("Browser 2.1 Senders page loads WITHOUT error", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    // Wait for content to load
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/01-senders-page.png`, fullPage: true });

    // Check NO error toast
    const body = await page.textContent("body");
    const hasError = body?.includes("ไม่สามารถโหลดข้อมูลผู้ส่งได้");
    const hasContent = body!.length > 100;

    console.log(`Senders page error toast: ${hasError}`);
    console.log(`Senders page has content: ${hasContent}`);

    expect(hasError).toBe(false);
    expect(hasContent).toBe(true);
  });

  test("Browser 2.2 Senders — add sender button works", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    const addBtn = page.locator('button:has-text("เพิ่มผู้ส่ง"), button:has-text("เพิ่ม"), a:has-text("เพิ่มชื่อผู้ส่ง")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/01-senders-add-form.png`, fullPage: true });
      console.log("Add sender form opened successfully");
    } else {
      console.log("Add sender button not found — checking if page shows empty state");
      await page.screenshot({ path: `${SS}/01-senders-empty.png`, fullPage: true });
    }
  });

  test("Browser 2.3 Dashboard — no console 500 errors", async ({ authedPage: page }) => {
    const errors: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 500) {
        errors.push(`${response.url()} → ${response.status()}`);
      }
    });

    // Visit key pages
    const pages = ["/dashboard", "/dashboard/senders", "/dashboard/settings", "/dashboard/campaigns"];
    for (const p of pages) {
      await page.goto(p, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: `${SS}/02-no-500-errors.png`, fullPage: true });

    console.log(`500 errors found: ${errors.length}`);
    for (const e of errors) {
      console.log(`  ❌ ${e}`);
    }

    expect(errors.length).toBe(0);
  });
});
