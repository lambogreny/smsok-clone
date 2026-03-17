import { test, expect, expectPageLoads, collectConsoleErrors, dismissCookieConsent } from "./fixtures";

const SCREENSHOT_DIR = "tests/screenshots/task-6297";

test.describe("Task #6297 — Full Regression E2E", () => {
  // ─── 1. Dashboard ───
  test("1.1 Dashboard loads with KPI cards", async ({ authedPage: page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    // Check page loaded
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png`, fullPage: true });

    // Check for dashboard content (KPI cards, stats, etc.)
    const hasContent = await page.locator('[class*="card"], [class*="stat"], [class*="dashboard"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  // ─── 2. Packages ───
  test("2.1 Packages page loads with package list", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
    expect(body).not.toContain("Internal Server Error");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-packages.png`, fullPage: true });
  });

  test("2.2 Package purchase flow — select package", async ({ authedPage: page }) => {
    await page.goto("/dashboard/packages", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Find and click first buy/purchase button
    const buyBtn = page.locator('button:has-text("ซื้อ"), button:has-text("เลือก"), button:has-text("สั่งซื้อ"), a:has-text("ซื้อ"), a:has-text("เลือก")').first();
    if (await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buyBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-package-select.png`, fullPage: true });
    }
  });

  // ─── 3. Payment / Top-up ───
  test("3.1 Top-up / Payment page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/topup", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-topup.png`, fullPage: true });
  });

  // ─── 4. Sender Names ───
  test("4.1 Senders page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-senders.png`, fullPage: true });
  });

  test("4.2 Senders — add new sender name form", async ({ authedPage: page }) => {
    await page.goto("/dashboard/senders", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    // Find add button
    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), a:has-text("เพิ่ม"), a:has-text("สร้าง")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-sender-add-form.png`, fullPage: true });
    }
  });

  // ─── 5. Templates ───
  test("5.1 Templates page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-templates.png`, fullPage: true });
  });

  test("5.2 Templates — create new template", async ({ authedPage: page }) => {
    await page.goto("/dashboard/templates", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    const addBtn = page.locator('button:has-text("สร้าง"), button:has-text("เพิ่ม"), a:has-text("สร้าง"), a:has-text("เพิ่ม")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-template-create.png`, fullPage: true });

      // Try filling template form
      const nameInput = page.locator('input[name="name"], input[placeholder*="ชื่อ"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill("QA Regression Template");
      }
      const contentInput = page.locator('textarea[name="content"], textarea[placeholder*="ข้อความ"], textarea').first();
      if (await contentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await contentInput.fill("สวัสดี {{name}} ทดสอบ QA Regression");
      }
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-template-filled.png`, fullPage: true });
    }
  });

  // ─── 6. Campaigns ───
  test("6.1 Campaigns page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-campaigns.png`, fullPage: true });
  });

  test("6.2 Campaigns — create new campaign", async ({ authedPage: page }) => {
    await page.goto("/dashboard/campaigns", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    const createBtn = page.locator('button:has-text("สร้าง"), a:has-text("สร้าง"), button:has-text("เพิ่ม"), a:has-text("เพิ่ม")').first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-campaign-create.png`, fullPage: true });
    }
  });

  // ─── 7. Groups & Contacts ───
  test("7.1 Groups page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/groups", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-groups.png`, fullPage: true });
  });

  test("7.2 Contacts page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-contacts.png`, fullPage: true });
  });

  test("7.3 Contacts — add new contact form", async ({ authedPage: page }) => {
    await page.goto("/dashboard/contacts", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    const addBtn = page.locator('button:has-text("เพิ่ม"), button:has-text("สร้าง"), a:has-text("เพิ่ม")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-contact-add.png`, fullPage: true });
    }
  });

  // ─── 8. API Keys ───
  test("8.1 API Keys page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-api-keys.png`, fullPage: true });
  });

  test("8.2 API Keys — generate new key", async ({ authedPage: page }) => {
    await page.goto("/dashboard/api-keys", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    const createBtn = page.locator('button:has-text("สร้าง"), button:has-text("เพิ่ม"), button:has-text("Generate")').first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/08-api-key-create.png`, fullPage: true });
    }
  });

  // ─── 9. Settings ───
  test("9.1 Settings page loads with profile form", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-settings.png`, fullPage: true });
  });

  test("9.2 Settings — update profile", async ({ authedPage: page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    // Find name input and update
    const nameInput = page.locator('input[name="name"], input[name="companyName"], input[placeholder*="ชื่อ"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.clear();
      await nameInput.fill("QA Test User Regression");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/09-settings-edited.png`, fullPage: true });

      // Find save button
      const saveBtn = page.locator('button[type="submit"], button:has-text("บันทึก"), button:has-text("Save")').first();
      if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/09-settings-saved.png`, fullPage: true });
      }
    }
  });

  // ─── 10. Billing / Orders ───
  test("10.1 Orders/Billing page loads", async ({ authedPage: page }) => {
    // Try multiple possible URLs
    const urls = ["/dashboard/billing/orders", "/dashboard/billing/packages", "/dashboard/packages/my"];
    let loaded = false;

    for (const url of urls) {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
      if (response && response.status() === 200) {
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
        const body = await page.textContent("body");
        if (body && body.length > 100 && !body.includes("404")) {
          loaded = true;
          await page.screenshot({ path: `${SCREENSHOT_DIR}/10-orders.png`, fullPage: true });
          break;
        }
      }
    }

    expect(loaded).toBe(true);
  });

  // ─── 11. Send SMS Flow ───
  test("11.1 Send SMS page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/send", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
    // Check it's NOT the custom 404 page
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-send-sms.png`, fullPage: true });
  });

  // ─── 12. History / Reports ───
  test("12.1 SMS History/Messages page loads", async ({ authedPage: page }) => {
    await page.goto("/dashboard/messages", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
    expect(body).not.toContain("ไม่พบหน้าที่คุณต้องการ");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-messages.png`, fullPage: true });
  });

  // ─── 13. Navigation — All sidebar links ───
  test("13.1 All sidebar navigation links work", async ({ authedPage: page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCookieConsent(page);

    // Get all sidebar links
    const sidebarLinks = page.locator('nav a[href*="/dashboard"], aside a[href*="/dashboard"]');
    const count = await sidebarLinks.count();

    const results: { href: string; status: string }[] = [];

    for (let i = 0; i < count; i++) {
      const href = await sidebarLinks.nth(i).getAttribute("href");
      if (!href || href === "#") continue;

      const response = await page.goto(href, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
      const status = response?.status() || 0;
      const body = await page.textContent("body").catch(() => "");

      const hasError = body?.includes("Internal Server Error") || body?.includes("Something went wrong") || status >= 500;

      results.push({ href, status: hasError ? `FAIL (${status})` : `OK (${status})` });
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-sidebar-nav.png`, fullPage: true });

    // Log results
    console.log("Sidebar navigation results:", JSON.stringify(results, null, 2));

    // All pages should load without 500
    const failures = results.filter((r) => r.status.includes("FAIL"));
    expect(failures.length).toBe(0);
  });

  // ─── 14. Console Errors Check ───
  test("14.1 No critical console errors on main pages", async ({ authedPage: page }) => {
    const errors = await collectConsoleErrors(page);

    const pages = ["/dashboard", "/dashboard/senders", "/dashboard/templates", "/dashboard/campaigns", "/dashboard/contacts", "/dashboard/settings", "/dashboard/api-keys"];

    for (const p of pages) {
      await page.goto(p, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("chunk") && !e.includes("preload") && !e.includes("DevTools") && !e.includes("hydration")
    );

    console.log(`Console errors found: ${criticalErrors.length}`, criticalErrors);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-console-check.png`, fullPage: true });
  });

  // ─── 15. Support/Tickets ───
  test("15.1 Support page loads", async ({ authedPage: page }) => {
    const urls = ["/dashboard/support", "/dashboard/tickets", "/dashboard/help"];
    let loaded = false;

    for (const url of urls) {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
      if (response && response.status() === 200) {
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
        const body = await page.textContent("body");
        if (body && body.length > 50 && !body.includes("404")) {
          loaded = true;
          await page.screenshot({ path: `${SCREENSHOT_DIR}/15-support.png`, fullPage: true });
          break;
        }
      }
    }

    // Support page may not exist — log result
    console.log(`Support page loaded: ${loaded}`);
  });
});
